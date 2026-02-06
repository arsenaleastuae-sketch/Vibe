'use strict';

(function () {
  var Marzipano = window.Marzipano;
  var bowser = window.bowser;
  var screenfull = window.screenfull;
  var data = window.APP_DATA;

  // Grab elements from DOM.
  var panoElement = document.querySelector('#pano');
  var sceneNameElement = document.querySelector('#titleBar .sceneName');
  var sceneListElement = document.querySelector('#sceneList');
  var sceneElements = document.querySelectorAll('#sceneList .scene');
  var sceneListToggleElement = document.querySelector('#sceneListToggle');
  var autorotateToggleElement = document.querySelector('#autorotateToggle');
  var fullscreenToggleElement = document.querySelector('#fullscreenToggle');

  // Detect desktop or mobile mode.
  if (window.matchMedia) {
    var setMode = function () {
      if (mql.matches) {
        document.body.classList.remove('desktop');
        document.body.classList.add('mobile');
      } else {
        document.body.classList.remove('mobile');
        document.body.classList.add('desktop');
      }
    };
    var mql = matchMedia('(max-width: 500px), (max-height: 500px)');
    setMode();
    mql.addListener(setMode);
  } else {
    document.body.classList.add('desktop');
  }

  // Detect whether we are on a touch device.
  document.body.classList.add('no-touch');
  window.addEventListener('touchstart', function () {
    document.body.classList.remove('no-touch');
    document.body.classList.add('touch');
  }, { passive: true });

  // Use tooltip fallback mode on IE < 11.
  if (bowser.msie && parseFloat(bowser.version) < 11) {
    document.body.classList.add('tooltip-fallback');
  }

  // Viewer options.
  var viewerOpts = {
    controls: {
      mouseViewMode: data.settings.mouseViewMode
    }
  };

  // Initialize viewer.
  var viewer = new Marzipano.Viewer(panoElement, viewerOpts);

  // ===== Experience state =====
  var STORAGE_KEY = 'findYourCocktail__visited_v1';
  var visited = loadVisited();
  var currentSceneRef = null;
  var hotspotRegistry = []; // { id, sceneId, el, hotspotData }

  var sound = createSoundManager();
  var ui = createUI();
  var fade = ensureSceneFade();

  // Create scenes.
  var scenes = data.scenes.map(function (sceneData) {
    var urlPrefix = 'tiles';
    var source = Marzipano.ImageUrlSource.fromString(
      urlPrefix + '/' + sceneData.id + '/{z}/{f}/{y}/{x}.jpg',
      { cubeMapPreviewUrl: urlPrefix + '/' + sceneData.id + '/preview.jpg' }
    );
    var geometry = new Marzipano.CubeGeometry(sceneData.levels);

    var limiter = Marzipano.RectilinearView.limit.traditional(sceneData.faceSize, 100 * Math.PI / 180, 120 * Math.PI / 180);
    var view = new Marzipano.RectilinearView(sceneData.initialViewParameters, limiter);

    var scene = viewer.createScene({
      source: source,
      geometry: geometry,
      view: view,
      pinFirstLevel: true
    });

    // Link hotspots.
    sceneData.linkHotspots.forEach(function (hotspot) {
      var element = createLinkHotspotElement(hotspot);
      scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
    });

    // Info hotspots.
    sceneData.infoHotspots.forEach(function (hotspot) {
      var element = createInfoHotspotElement(hotspot, sceneData.id, view);
      scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
    });

    // Hidden hotspot reveal logic (per-scene)
    attachRevealWatcher(view, sceneData.id);

    return {
      data: sceneData,
      scene: scene,
      view: view
    };
  });

  // Autorotate baseline (we will use gentle idle movement even when autorotate button is off).
  var autorotate = Marzipano.autorotate({
    yawSpeed: 0.025,
    targetPitch: 0,
    targetFov: Math.PI / 2
  });

  if (data.settings.autorotateEnabled) {
    autorotateToggleElement.classList.add('enabled');
  }
  autorotateToggleElement.addEventListener('click', toggleAutorotate);

  // Fullscreen.
  if (screenfull.enabled && data.settings.fullscreenButton) {
    document.body.classList.add('fullscreen-enabled');
    fullscreenToggleElement.addEventListener('click', function () {
      screenfull.toggle();
    });
    screenfull.on('change', function () {
      if (screenfull.isFullscreen) {
        fullscreenToggleElement.classList.add('enabled');
      } else {
        fullscreenToggleElement.classList.remove('enabled');
      }
    });
  } else {
    document.body.classList.add('fullscreen-disabled');
  }

  // Scene list toggle.
  sceneListToggleElement.addEventListener('click', toggleSceneList);

  // Start with scene list open on desktop.
  if (!document.body.classList.contains('mobile')) {
    showSceneList();
  }

  // Scene switch handlers.
  scenes.forEach(function (scene) {
    var el = document.querySelector('#sceneList .scene[data-id="' + scene.data.id + '"]');
    if (!el) return;
    el.addEventListener('click', function () {
      switchScene(scene);
      if (document.body.classList.contains('mobile')) {
        hideSceneList();
      }
    });
  });

  // View controls (existing template).
  var viewUpElement = document.querySelector('#viewUp');
  var viewDownElement = document.querySelector('#viewDown');
  var viewLeftElement = document.querySelector('#viewLeft');
  var viewRightElement = document.querySelector('#viewRight');
  var viewInElement = document.querySelector('#viewIn');
  var viewOutElement = document.querySelector('#viewOut');

  var velocity = 0.7;
  var friction = 3;

  var controls = viewer.controls();
  controls.registerMethod('upElement', new Marzipano.ElementPressControlMethod(viewUpElement, 'y', -velocity, friction), true);
  controls.registerMethod('downElement', new Marzipano.ElementPressControlMethod(viewDownElement, 'y', velocity, friction), true);
  controls.registerMethod('leftElement', new Marzipano.ElementPressControlMethod(viewLeftElement, 'x', -velocity, friction), true);
  controls.registerMethod('rightElement', new Marzipano.ElementPressControlMethod(viewRightElement, 'x', velocity, friction), true);
  controls.registerMethod('inElement', new Marzipano.ElementPressControlMethod(viewInElement, 'zoom', -velocity, friction), true);
  controls.registerMethod('outElement', new Marzipano.ElementPressControlMethod(viewOutElement, 'zoom', velocity, friction), true);

  // ----- Helpers -----
  function sanitize(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function showSceneList() {
    sceneListElement.classList.add('enabled');
    sceneListToggleElement.classList.add('enabled');
  }

  function hideSceneList() {
    sceneListElement.classList.remove('enabled');
    sceneListToggleElement.classList.remove('enabled');
  }

  function toggleSceneList() {
    sceneListElement.classList.toggle('enabled');
    sceneListToggleElement.classList.toggle('enabled');
  }

  function startAutorotate() {
    if (!autorotateToggleElement.classList.contains('enabled')) {
      return;
    }
    viewer.startMovement(autorotate);
    viewer.setIdleMovement(3000, autorotate);
  }

  function stopAutorotate() {
    viewer.stopMovement();
    viewer.setIdleMovement(Infinity);
  }

  function toggleAutorotate() {
    if (autorotateToggleElement.classList.contains('enabled')) {
      autorotateToggleElement.classList.remove('enabled');
      stopAutorotate();
    } else {
      autorotateToggleElement.classList.add('enabled');
      startAutorotate();
    }
  }

  function updateSceneName(scene) {
    sceneNameElement.innerHTML = sanitize(scene.data.name);
  }

  function updateSceneList(scene) {
    for (var i = 0; i < sceneElements.length; i++) {
      var el = sceneElements[i];
      if (el.getAttribute('data-id') === scene.data.id) {
        el.classList.add('current');
      } else {
        el.classList.remove('current');
      }
    }
  }

  function switchScene(scene) {
    stopAutorotate();

    // Cinema transition
    cinema.pulse('scene');

    // Fade transition
    fade.in();
    setTimeout(function () {
      scene.view.setParameters(scene.data.initialViewParameters);
      scene.scene.switchTo();
      currentSceneRef = scene;
      updateSceneName(scene);
      updateSceneList(scene);

      // Gentle idle movement (subtle) even if autorotate is off.
      viewer.setIdleMovement(4500, Marzipano.autorotate({ yawSpeed: 0.012, targetPitch: 0, targetFov: scene.view.parameters().fov }));

      // Update UI for this scene
      ui.setScene(scene.data.id);
      updateAllHotspotVisibility();

      // Hint for hidden hotspot (if any)
      maybeShowSceneHint(scene.data.id);

      startAutorotate();
      fade.out();
    }, 160);
  }

  function findSceneById(id) {
    for (var i = 0; i < scenes.length; i++) {
      if (scenes[i].data.id === id) return scenes[i];
    }
    return null;
  }

  function findSceneDataById(id) {
    for (var i = 0; i < data.scenes.length; i++) {
      if (data.scenes[i].id === id) return data.scenes[i];
    }
    return null;
  }

  // ----- Hotspots -----
  function createLinkHotspotElement(hotspot) {
    var wrapper = document.createElement('div');
    wrapper.classList.add('hotspot');
    wrapper.classList.add('link-hotspot');

    var icon = document.createElement('img');
    icon.src = 'img/link.png';
    icon.classList.add('link-hotspot-icon');

    // rotation
    var transformProperties = ['-ms-transform', '-webkit-transform', 'transform'];
    for (var i = 0; i < transformProperties.length; i++) {
      icon.style[transformProperties[i]] = 'rotate(' + hotspot.rotation + 'rad)';
    }

    wrapper.addEventListener('click', function () {
      sound.uiClick();
      switchScene(findSceneById(hotspot.target));
    });

    stopTouchAndScrollEventPropagation(wrapper);

    var tooltip = document.createElement('div');
    tooltip.classList.add('hotspot-tooltip');
    tooltip.classList.add('link-hotspot-tooltip');
    tooltip.innerHTML = sanitize(findSceneDataById(hotspot.target).name);

    wrapper.appendChild(icon);
    wrapper.appendChild(tooltip);

    return wrapper;
  }

  function createInfoHotspotElement(hotspot, sceneId, view) {
    var wrapper = document.createElement('div');
    wrapper.classList.add('hotspot');
    wrapper.classList.add('cocktail-hotspot');

    // Registry
    var hid = hotspot.id || (sceneId + '_' + hotspot.yaw.toFixed(4) + '_' + hotspot.pitch.toFixed(4));

    if (hotspot.hidden) {
      wrapper.classList.add('is-hidden');
      wrapper.setAttribute('data-hidden', 'true');
    }

    if (!visited[hid]) {
      wrapper.classList.add('is-unvisited');
    }

    wrapper.dataset.hotspotId = hid;
    wrapper.dataset.sceneId = sceneId;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cocktail-hotspot-btn';
    btn.setAttribute('aria-label', hotspot.title || 'Cocktail');

    // Ripple layer for tap feedback
    var ripple = document.createElement('span');
    ripple.className = 'cocktail-hotspot-ripple';

    var icon = document.createElement('img');
    icon.src = 'img/cocktails/cocktail-icon.svg';
    icon.className = 'cocktail-hotspot-icon';
    icon.alt = '';
    icon.setAttribute('aria-hidden', 'true');

    btn.appendChild(ripple);
    btn.appendChild(icon);
    wrapper.appendChild(btn);

    // Tooltip
    var tooltip = document.createElement('div');
    tooltip.className = 'cocktail-tooltip';
    tooltip.innerHTML = '<div class="cocktail-tooltip-title">' + sanitize(hotspot.title || '') + '</div>'
      + (hotspot.subtitle ? '<div class="cocktail-tooltip-sub">' + sanitize(hotspot.subtitle) + '</div>' : '');
    wrapper.appendChild(tooltip);

    // Mobile hint: show tooltip briefly on touch
    wrapper.addEventListener('touchstart', function () {
      wrapper.classList.add('show-tooltip');
      setTimeout(function () { wrapper.classList.remove('show-tooltip'); }, 900);
    }, { passive: true });

    // Click opens centered modal
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      // Tap feedback
      try { if (navigator.vibrate) navigator.vibrate(15); } catch (_) {}

      // Ensure sound starts on first interaction
      sound.arm();
      sound.iceClink();

      ensureCocktailModal().openCocktail(hotspot);

      // Mark visited
      if (!visited[hid]) {
        visited[hid] = Date.now();
        saveVisited(visited);
        wrapper.classList.remove('is-unvisited');
        ui.updateProgress();
      }

      // Suggest next
      highlightNextUnvisited();
    });

    stopTouchAndScrollEventPropagation(wrapper);

    hotspotRegistry.push({
      id: hid,
      sceneId: sceneId,
      el: wrapper,
      hotspotData: hotspot,
      view: view
    });

    return wrapper;
  }

  // Prevent touch and scroll events from reaching the parent element.
  function stopTouchAndScrollEventPropagation(element) {
    var eventList = ['touchstart', 'touchmove', 'touchend', 'touchcancel', 'wheel', 'mousewheel'];
    for (var i = 0; i < eventList.length; i++) {
      element.addEventListener(eventList[i], function (event) {
        event.stopPropagation();
      }, { passive: false });
    }
  }

  // ----- Modal -----
  function ensureCocktailModal() {
    if (window.__cocktailModal) return window.__cocktailModal;

    var overlay = document.createElement('div');
    overlay.className = 'cocktail-modal-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    var modal = document.createElement('div');
    modal.className = 'cocktail-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    modal.innerHTML = ''
      + '<button class="cocktail-modal-close" type="button" aria-label="Close">&times;</button>'
      + '<div class="cocktail-modal-body">'
      + '  <div class="cocktail-modal-media">'
      + '    <img class="cocktail-modal-image" src="" alt="" loading="lazy">'
      + '  </div>'
      + '  <div class="cocktail-modal-content">'
      + '    <div class="cocktail-modal-title"></div>'
      + '    <div class="cocktail-modal-subtitle"></div>'
      + '    <div class="cocktail-modal-description"></div>'
      + '    <div class="cocktail-modal-meta"></div>'
      + '  </div>'
      + '</div>'
      + '<div class="cocktail-modal-footer">'
      + '  <a class="cocktail-modal-order" href="#" target="_self" rel="noopener">Заказать</a>'
      + '</div>';

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    var closeBtn = modal.querySelector('.cocktail-modal-close');

    function openBase() {
      cinema.pulse('modal');
      overlay.classList.add('visible');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('cocktail-modal-open');
      sound.arm();
    }

    function close() {
      overlay.classList.remove('visible');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('cocktail-modal-open');
      // return focus to pano
      try { panoElement.focus(); } catch (_) {}
    }

    function openCocktail(c) {
      var img = modal.querySelector('.cocktail-modal-image');
      img.src = c.image || 'img/cocktails/cocktail-1.gif';
      img.alt = c.title || 'Cocktail';

      modal.querySelector('.cocktail-modal-title').textContent = c.title || '';
      modal.querySelector('.cocktail-modal-subtitle').textContent = c.subtitle || '';
      modal.querySelector('.cocktail-modal-description').textContent = c.description || '';

      var meta = [];
      if (c.strength) meta.push('Крепость: ' + c.strength);
      if (c.price) meta.push('Цена: ' + c.price);
      modal.querySelector('.cocktail-modal-meta').textContent = meta.join(' • ');

      var order = modal.querySelector('.cocktail-modal-order');
      order.textContent = 'Заказать';
      order.href = c.orderUrl || '#';

      openBase();
    }

    function openCustom(opts) {
      var img = modal.querySelector('.cocktail-modal-image');
      img.src = opts.image || 'img/cocktails/cocktail-icon.svg';
      img.alt = opts.title || '';

      modal.querySelector('.cocktail-modal-title').textContent = opts.title || '';
      modal.querySelector('.cocktail-modal-subtitle').textContent = opts.subtitle || '';
      modal.querySelector('.cocktail-modal-description').innerHTML = opts.html || '';
      modal.querySelector('.cocktail-modal-meta').textContent = opts.meta || '';

      var order = modal.querySelector('.cocktail-modal-order');
      order.textContent = opts.buttonText || 'ОК';
      order.href = opts.buttonHref || '#';

      openBase();
    }

    // Close behaviors
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('visible')) close();
    });

    stopTouchAndScrollEventPropagation(modal);

    window.__cocktailModal = { openCocktail: openCocktail, openCustom: openCustom, close: close, overlay: overlay, modal: modal };
    return window.__cocktailModal;
  }

  // ----- Reveal watcher for hidden hotspots -----
  var hintShownByScene = {};

  function attachRevealWatcher(view, sceneId) {
    // Throttled check
    var last = 0;
    var check = function () {
      var now = Date.now();
      if (now - last < 180) return;
      last = now;

      var vp = view.parameters();
      revealByView(sceneId, vp.yaw, vp.pitch);
    };

    // Marzipano view emits 'change'
    if (typeof view.addEventListener === 'function') {
      view.addEventListener('change', check);
    }

    // also periodic fallback
    setInterval(check, 700);
  }

  function angleDiff(a, b) {
    var d = a - b;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return Math.abs(d);
  }

  function revealByView(sceneId, yaw, pitch) {
    hotspotRegistry.forEach(function (item) {
      if (item.sceneId !== sceneId) return;
      var h = item.hotspotData;
      if (!h.hidden) return;
      if (!item.el.classList.contains('is-hidden')) return;
      var threshold = (h.reveal && h.reveal.threshold) ? h.reveal.threshold : 0.22;

      // match yaw/pitch proximity (simple)
      if (angleDiff(yaw, h.yaw) < threshold && Math.abs(pitch - h.pitch) < threshold) {
        item.el.classList.remove('is-hidden');
        item.el.removeAttribute('data-hidden');
        sound.uiClick();
        ui.toast('Секрет найден 👀');
      }
    });
  }

  function maybeShowSceneHint(sceneId) {
    if (hintShownByScene[sceneId]) return;

    var hasHidden = hotspotRegistry.some(function (h) {
      return h.sceneId === sceneId && h.hotspotData.hidden && h.el.classList.contains('is-hidden');
    });

    if (!hasHidden) return;

    hintShownByScene[sceneId] = true;
    setTimeout(function () {
      // if still hidden after a few seconds, hint
      var stillHidden = hotspotRegistry.some(function (h) {
        return h.sceneId === sceneId && h.hotspotData.hidden && h.el.classList.contains('is-hidden');
      });
      if (stillHidden) {
        ui.toast('Подсказка: осмотрись внимательнее — есть скрытый коктейль');
      }
    }, 5200);
  }

  // ----- Filters -----
  var activeTag = 'all';

  function updateAllHotspotVisibility() {
    hotspotRegistry.forEach(function (item) {
      // hidden stays hidden until revealed
      if (item.hotspotData.hidden && item.el.classList.contains('is-hidden')) {
        item.el.style.display = 'none';
        return;
      }

      // filter
      if (activeTag === 'all') {
        item.el.style.display = '';
        return;
      }

      var tags = item.hotspotData.tags || [];
      item.el.style.display = tags.indexOf(activeTag) >= 0 ? '' : 'none';
    });

    ui.setFilter(activeTag);
  }

  // highlight next unvisited in current scene
  function highlightNextUnvisited() {
    cinema.pulse('hint');
    hotspotRegistry.forEach(function (h) {
      h.el.classList.remove('next');
      h.el.classList.remove('nav-strong','nav-light','nav-sweet','nav-citrus','nav-signature','nav-all');
    });
    if (!currentSceneRef) return;

    var next = hotspotRegistry.find(function (h) {
      return h.sceneId === currentSceneRef.data.id && !visited[h.id] && (!h.hotspotData.hidden || !h.el.classList.contains('is-hidden'));
    });

    if (next) {
      next.el.classList.add('next');
      var tag = activeTag && activeTag !== 'all' ? activeTag : ((next.hotspotData.tags && next.hotspotData.tags[0]) || 'all');
      next.el.classList.add('nav-' + tag);
    }
  }

  // ----- Progress -----
  function allCocktails() {
    return hotspotRegistry.map(function (h) { return h.id; });
  }

  function visitedCount() {
    var ids = allCocktails();
    var c = 0;
    for (var i = 0; i < ids.length; i++) {
      if (visited[ids[i]]) c++;
    }
    return c;
  }

  function totalCount() {
    return allCocktails().length;
  }

  function loadVisited() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function saveVisited(obj) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(obj || {})); } catch (_) {}
  }

  // ----- UI -----
  function createUI() {
    // Tint overlay for time-of-day
    var tint = document.createElement('div');
    tint.className = 'pano-tint';
    panoElement.appendChild(tint);

    // HUD
    var hud = document.createElement('div');
    hud.className = 'cocktail-hud';

    hud.innerHTML = ''
      + '<div class="hud-left">'
      + '  <div class="hud-progress"><span class="hud-progress-value">0/0</span> <span class="hud-progress-label">коктейлей открыто</span></div>'
      + '</div>'
      + '<div class="hud-right">'
      + '  <button class="hud-btn" data-action="barman" type="button">Бармен</button>'
      + '  <button class="hud-btn" data-action="filter" type="button">Фильтр</button>'
      + '  <button class="hud-btn" data-action="builder" type="button">Собрать</button>'
      + '  <button class="hud-btn" data-action="mode" type="button">Вечер</button>'
      + '  <button class="hud-btn" data-action="sound" type="button">Звук</button>'
      + '  <button class="hud-btn" data-action="gyro" type="button">Gyro</button>'
      + '</div>';

    document.body.appendChild(hud);

    // Panels
    var panel = document.createElement('div');
    panel.className = 'hud-panel';
    panel.innerHTML = ''
      + '<div class="hud-panel-card">'
      + '  <div class="hud-panel-header">Фильтр</div>'
      + '  <div class="hud-chips">'
      + '    <button type="button" class="hud-chip" data-tag="all">Все</button>'
      + '    <button type="button" class="hud-chip" data-tag="strong">Крепкие</button>'
      + '    <button type="button" class="hud-chip" data-tag="light">Лёгкие</button>'
      + '    <button type="button" class="hud-chip" data-tag="sweet">Сладкие</button>'
      + '    <button type="button" class="hud-chip" data-tag="citrus">Цитрус</button>'
      + '    <button type="button" class="hud-chip" data-tag="signature">Авторские</button>'
      + '  </div>'
      + '  <button type="button" class="hud-panel-close">Закрыть</button>'
      + '</div>';
    document.body.appendChild(panel);

    var toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);

    var state = {
      sceneId: null,
      modeIndex: 1, // 0 day,1 evening,2 night
      soundEnabled: true,
      gyroEnabled: false
    };

    var modes = [
      { key: 'day', label: 'День', tint: 'rgba(255,255,255,0.00)' },
      { key: 'evening', label: 'Вечер', tint: 'rgba(255,186,130,0.10)' },
      { key: 'night', label: 'Ночь', tint: 'rgba(20,40,70,0.20)' }
    ];

    function setMode(idx) {
      state.modeIndex = (idx + modes.length) % modes.length;
      var m = modes[state.modeIndex];
      tint.style.background = m.tint;
      var modeBtn = hud.querySelector('[data-action="mode"]');
      modeBtn.textContent = m.label;
      document.body.setAttribute('data-mode', m.key);
      sound.setMood(m.key);
    }

    function updateProgress() {
      var el = hud.querySelector('.hud-progress-value');
      el.textContent = visitedCount() + '/' + totalCount();
    }

    function openPanel() {
      panel.classList.add('visible');
    }

    function closePanel() {
      panel.classList.remove('visible');
    }

    function toastMsg(msg) {
      toast.textContent = msg;
      toast.classList.add('visible');
      setTimeout(function () { toast.classList.remove('visible'); }, 2200);
    }

    // Button handlers
    hud.addEventListener('click', function (e) {
      var btn = e.target.closest('.hud-btn');
      if (!btn) return;
      sound.arm();

      var action = btn.getAttribute('data-action');
      if (action === 'barman') {
        sound.uiClick();
        openBarman();
      } else if (action === 'filter') {
        openPanel();
        sound.uiClick();
      } else if (action === 'builder') {
        sound.uiClick();
        openBuilder();
      } else if (action === 'mode') {
        sound.uiClick();
        setMode(state.modeIndex + 1);
      } else if (action === 'sound') {
        state.soundEnabled = !state.soundEnabled;
        btn.classList.toggle('is-on', state.soundEnabled);
        sound.setEnabled(state.soundEnabled);
        toastMsg(state.soundEnabled ? 'Звук включён' : 'Звук выключен');
      } else if (action === 'gyro') {
        state.gyroEnabled = !state.gyroEnabled;
        btn.classList.toggle('is-on', state.gyroEnabled);
        toggleGyro(state.gyroEnabled);
        toastMsg(state.gyroEnabled ? 'Gyro включён' : 'Gyro выключен');
      }
    });

    panel.querySelector('.hud-panel-close').addEventListener('click', function () {
      sound.uiClick();
      closePanel();
    });

    panel.addEventListener('click', function (e) {
      var chip = e.target.closest('.hud-chip');
      if (!chip) return;
      activeTag = chip.getAttribute('data-tag');
      sound.uiClick();
      updateAllHotspotVisibility();
      closePanel();
      highlightNextUnvisited();
      toastMsg(activeTag === 'all' ? 'Показаны все' : 'Фильтр: ' + chip.textContent);
    });

    // Default
    setMode(state.modeIndex);
    updateProgress();
    hud.querySelector('[data-action="sound"]').classList.add('is-on');

    function setScene(sceneId) {
      state.sceneId = sceneId;
      updateProgress();
      highlightNextUnvisited();
    }

    function setFilter(tag) {
      var chips = panel.querySelectorAll('.hud-chip');
      for (var i = 0; i < chips.length; i++) {
        chips[i].classList.toggle('active', chips[i].getAttribute('data-tag') === tag);
      }
    }

    // Cocktail builder
    function openBuilder() {
      var html = ''
        + '<div class="builder">'
        + '  <div class="builder-row">Выберите настроение:</div>'
        + '  <div class="builder-grid">'
        + '    <button type="button" class="builder-btn" data-pick="strong">Крепкий</button>'
        + '    <button type="button" class="builder-btn" data-pick="light">Лёгкий</button>'
        + '    <button type="button" class="builder-btn" data-pick="sweet">Сладкий</button>'
        + '    <button type="button" class="builder-btn" data-pick="citrus">Цитрус</button>'
        + '  </div>'
        + '  <div class="builder-note">Подберём коктейль и покажем его на панораме.</div>'
        + '</div>';

      var m = ensureCocktailModal();
      m.openCustom({
        title: 'Конструктор коктейля',
        subtitle: 'Бар / ресторан',
        html: html,
        meta: '',
        image: 'img/cocktails/cocktail-2.gif',
        buttonText: 'Закрыть',
        buttonHref: '#'
      });

      // Attach handlers inside modal
      setTimeout(function () {
        var modal = m.modal;
        var buttons = modal.querySelectorAll('.builder-btn');
        for (var i = 0; i < buttons.length; i++) {
          buttons[i].addEventListener('click', function (e) {
            var tag = e.currentTarget.getAttribute('data-pick');
            activeTag = tag;
            updateAllHotspotVisibility();
            m.close();
            toastMsg('Рекомендации: ' + e.currentTarget.textContent);
            highlightNextUnvisited();

            // If the best match is in another scene, gently guide by opening scene list.
            var best = hotspotRegistry.find(function (h) {
              return (h.hotspotData.tags || []).indexOf(tag) >= 0;
            });
            if (best && currentSceneRef && best.sceneId !== currentSceneRef.data.id) {
              showSceneList();
              toastMsg('Есть подходящий коктейль в другой зоне — выбери сцену');
            }
          });
        }
      }, 30);
    // "Barman" persona helper (recommendation + tip)
    function openBarman() {
      var m = ensureCocktailModal();

      // pick a recommendation: prioritize next unvisited in current scene, otherwise any unvisited
      var rec = null;
      if (currentSceneRef) {
        rec = hotspotRegistry.find(function (h) {
          return h.sceneId === currentSceneRef.data.id && !visited[h.id] && (!h.hotspotData.hidden || !h.el.classList.contains('is-hidden'));
        });
      }
      if (!rec) {
        rec = hotspotRegistry.find(function (h) {
          return !visited[h.id] && (!h.hotspotData.hidden || !h.el.classList.contains('is-hidden'));
        }) || hotspotRegistry[0];
      }

      var modeKey = document.body.getAttribute('data-mode') || 'evening';
      var tipsByMode = {
        day: [
          'Днём лучше заходят лёгкие и освежающие коктейли — они не перегружают вкус.',
          'Если планируешь обед — выбирай цитрус/лайм: помогает “собрать” аппетит.'
        ],
        evening: [
          'Вечером чаще всего берут авторские — идеальны для первого впечатления.',
          'Хочешь мягко начать — выбирай сладкий или цитрус, а крепкий оставь на потом.'
        ],
        night: [
          'Ночью заходят более крепкие и плотные вкусы — но не мешай слишком много разного.',
          'Если уже пробовал сладкий — следующий бери цитрус: он “обнуляет” рецепторы.'
        ]
      };

      var pool = tipsByMode[modeKey] || tipsByMode.evening;
      var tip = pool[Math.floor(Math.random() * pool.length)];

      var recTitle = rec && rec.hotspotData ? (rec.hotspotData.title || 'Рекомендация') : 'Рекомендация';
      var recSub = rec && rec.hotspotData ? (rec.hotspotData.subtitle || '') : '';

      var html = ''
        + '<div class="barman">'
        + '  <div class="barman-badge">Совет бармена</div>'
        + '  <div class="barman-tip">' + sanitize(tip) + '</div>'
        + '  <div class="barman-rec">'
        + '    <div class="barman-rec-title">Рекомендую сейчас:</div>'
        + '    <div class="barman-rec-name">' + sanitize(recTitle) + '</div>'
        + (recSub ? '<div class="barman-rec-sub">' + sanitize(recSub) + '</div>' : '')
        + '    <div class="barman-actions">'
        + '      <button type="button" class="barman-btn" data-barman-action="show">Показать на панораме</button>'
        + '      <button type="button" class="barman-btn secondary" data-barman-action="open">Открыть карточку</button>'
        + '    </div>'
        + '  </div>'
        + '</div>';

      m.openCustom({
        title: 'Бармен',
        subtitle: 'Бар / ресторан',
        html: html,
        meta: '',
        image: (rec && rec.hotspotData && rec.hotspotData.image) ? rec.hotspotData.image : 'img/cocktails/cocktail-3.gif',
        buttonText: 'Закрыть',
        buttonHref: '#'
      });

      // Wire actions
      setTimeout(function () {
        var modalEl = m.modal;
        var showBtn = modalEl.querySelector('[data-barman-action="show"]');
        var openBtn = modalEl.querySelector('[data-barman-action="open"]');

        function focusHotspot() {
          if (!rec) return;

          // Switch scene if needed
          if (currentSceneRef && rec.sceneId && currentSceneRef.data.id !== rec.sceneId) {
            var targetScene = findSceneById(rec.sceneId);
            if (targetScene) {
              switchScene(targetScene);
            }
          }

          // Highlight + gently steer view
          if (rec.view && rec.hotspotData) {
            try {
              var vp = rec.view.parameters();
              rec.view.setParameters({
                yaw: rec.hotspotData.yaw,
                pitch: rec.hotspotData.pitch,
                fov: vp.fov
              });
            } catch (e) {}
          }

          highlightNextUnvisited();
          ui.toast('Следуй за светом ✨');
        }

        if (showBtn) showBtn.addEventListener('click', function () {
          sound.uiClick();
          m.close();
          focusHotspot();
        });

        if (openBtn) openBtn.addEventListener('click', function () {
          sound.uiClick();
          if (rec && rec.hotspotData) {
            m.openCocktail(rec.hotspotData);
          }
        });
      }, 30);
    }

    }

    return {
      setScene: setScene,
      updateProgress: updateProgress,
      setFilter: setFilter,
      toast: toastMsg
    };
  }

  // ----- Scene fade overlay -----
  function ensureSceneFade() {
    var el = document.createElement('div');
    el.className = 'scene-fade';
    document.body.appendChild(el);

    var api = {
      in: function () { el.classList.add('visible'); },
      out: function () { setTimeout(function () { el.classList.remove('visible'); }, 80); }
    };
    return api;
  }

  // ----- Sound manager (local files; starts after first interaction) -----
  function createSoundManager() {
    var armed = false;
    var enabled = true;

    var ambient = new Audio('media/ambient-bar.wav');
    ambient.loop = true;
    ambient.volume = 0.18;

    var ice = new Audio('media/ice-clink.wav');
    ice.volume = 0.45;

    var click = new Audio('media/ui-click.wav');
    click.volume = 0.35;

    var whoosh = new Audio('media/whoosh.wav');
    whoosh.volume = 0.42;

    function arm() {
      if (armed) return;
      armed = true;
      if (!enabled) return;
      // Start ambient silently, then ramp
      try {
        ambient.volume = 0.01;
        ambient.play().then(function () {
          setTimeout(function () { if (enabled) ambient.volume = 0.18; }, 200);
        }).catch(function () { /* ignore */ });
      } catch (_) { /* ignore */ }
    }

    function setEnabled(v) {
      enabled = !!v;
      if (!enabled) {
        try { ambient.pause(); } catch (_) {}
      } else {
        arm();
        try { ambient.play(); } catch (_) {}
      }
    }

    function setMood(mood) {
      // subtle differences
      if (mood === 'day') ambient.volume = enabled ? 0.14 : 0;
      if (mood === 'evening') ambient.volume = enabled ? 0.18 : 0;
      if (mood === 'night') ambient.volume = enabled ? 0.12 : 0;
    }

    function iceClink() {
      if (!enabled) return;
      try { ice.currentTime = 0; ice.play(); } catch (_) {}
    }

    function uiClick() {
      if (!enabled) return;
      try { click.currentTime = 0; click.play(); } catch (_) {}
    }

    function whooshFx() {
      if (!enabled) return;
      try { whoosh.currentTime = 0; whoosh.play(); } catch (_) {}
    }

    // Also arm on any user gesture
    document.addEventListener('pointerdown', function () { arm(); }, { once: true });

    return {
      arm: arm,
      setEnabled: setEnabled,
      setMood: setMood,
      iceClink: iceClink,
      uiClick: uiClick,
      whooshFx: whooshFx
    };
  }

  
  // ----- Cinema transitions (focus pull + vignette + whoosh) -----
  function createCinemaFx() {
    // Vignette overlay
    var vignette = document.createElement('div');
    vignette.className = 'cinema-vignette';
    document.body.appendChild(vignette);

    // Bar beacon / light zone (screen-space "counter glow")
    var beacon = document.createElement('div');
    beacon.className = 'bar-beacon';
    beacon.setAttribute('aria-hidden', 'true');
    document.body.appendChild(beacon);

    var timer = null;

    function pulse(kind) {
      // kind: 'modal' | 'scene' | 'hint'
      document.body.classList.add('cinema-active');
      panoElement.classList.add('cinema-blur');

      // Whoosh (arm first)
      sound.arm();
      if (sound.whooshFx) sound.whooshFx();

      // Beacon glow intensifies briefly
      document.body.classList.add('beacon-pulse');

      // Focus pull: blur out then in
      clearTimeout(timer);
      timer = setTimeout(function () {
        panoElement.classList.remove('cinema-blur');
      }, 180);

      timer = setTimeout(function () {
        document.body.classList.remove('cinema-active');
        document.body.classList.remove('beacon-pulse');
      }, kind === 'scene' ? 720 : 520);
    }

    function setBeaconEnabled(v) {
      if (v) document.body.classList.add('beacon-on');
      else document.body.classList.remove('beacon-on');
    }

    // Default ON (subtle)
    setBeaconEnabled(true);

    return {
      pulse: pulse,
      setBeaconEnabled: setBeaconEnabled
    };
  }

  var cinema = createCinemaFx();

// ----- Gyroscope (mobile) -----
  var gyro = {
    on: false,
    handler: null,
    baseYaw: 0,
    basePitch: 0,
    last: 0
  };

  function toggleGyro(enable) {
    if (!enable) {
      gyro.on = false;
      if (gyro.handler) {
        window.removeEventListener('deviceorientation', gyro.handler);
        gyro.handler = null;
      }
      return;
    }

    // Only works on mobile with permission (iOS requires requestPermission)
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then(function (res) {
        if (res === 'granted') startGyro();
      }).catch(function () { /* ignore */ });
    } else {
      startGyro();
    }
  }

  function startGyro() {
    if (gyro.on) return;
    gyro.on = true;

    gyro.handler = function (ev) {
      if (!gyro.on) return;
      if (!currentSceneRef) return;
      // Throttle
      var now = Date.now();
      if (now - gyro.last < 30) return;
      gyro.last = now;

      // Map device orientation to yaw/pitch (simple + damped)
      var gamma = (ev.gamma || 0) * Math.PI / 180; // left-right
      var beta = (ev.beta || 0) * Math.PI / 180;   // front-back

      // Clamp beta
      if (beta > Math.PI / 2) beta = Math.PI / 2;
      if (beta < -Math.PI / 2) beta = -Math.PI / 2;

      var view = currentSceneRef.view;
      var p = view.parameters();

      var targetYaw = p.yaw + gamma * 0.018;
      var targetPitch = p.pitch + beta * 0.012;

      // Smooth
      var nyaw = p.yaw + (targetYaw - p.yaw) * 0.08;
      var npitch = p.pitch + (targetPitch - p.pitch) * 0.06;

      view.setParameters({ yaw: nyaw, pitch: npitch, fov: p.fov });
    };

    window.addEventListener('deviceorientation', gyro.handler, true);
  }

  // ----- Boot -----
  // Display the initial scene.
  switchScene(scenes[0]);

  // Initial UI state
  ui.updateProgress();
  updateAllHotspotVisibility();
  highlightNextUnvisited();

})();
