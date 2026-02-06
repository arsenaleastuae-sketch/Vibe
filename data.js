var APP_DATA = {
  "scenes": [
    {
      "id": "0-terrace-pancam001_people",
      "name": "Terrace PanCam001_People",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        }
      ],
      "faceSize": 2048,
      "initialViewParameters": {
        "yaw": 1.2398428009732996,
        "pitch": 0.21085745399118672,
        "fov": 1.4083983627516938
      },
      "linkHotspots": [
        {
          "yaw": 1.6187446821279092,
          "pitch": 0.06151890975591989,
          "rotation": 0,
          "target": "1-terrace-pancam002-people"
        }
      ],
      "infoHotspots": [
        {
          "id": "c3",
          "yaw": -2.5473427290485002,
          "pitch": 0.38837209783072524,
          "title": "Коктейль 3",
          "subtitle": "Тропический, освежающий",
          "image": "img/cocktails/cocktail-2.gif",
          "description": "Сочный тропический микс с лёгкой сладостью и яркой цитрусовой нотой. Идеален для начала вечера на террасе.",
          "tags": ["sweet", "tropical", "light"],
          "strength": "Лёгкий",
          "price": "12€",
          "orderUrl": "#order-c3",
          "hidden": true,
          "reveal": {
            "mode": "view",
            "threshold": 0.22,
            "hint": "Повернись к дальнему углу террасы — там есть секретный коктейль"
          }
        }
      ]
    },
    {
      "id": "1-terrace-pancam002-people",
      "name": "Terrace PanCam002 People",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        }
      ],
      "faceSize": 2048,
      "initialViewParameters": {
        "pitch": 0,
        "yaw": 0,
        "fov": 1.5707963267948966
      },
      "linkHotspots": [
        {
          "yaw": -1.5321252280167368,
          "pitch": 0.04642653970054589,
          "rotation": 0,
          "target": "0-terrace-pancam001_people"
        },
        {
          "yaw": 0.06716333768818572,
          "pitch": 0.1038292057836081,
          "rotation": 0,
          "target": "2-terrace-pancam003_people"
        }
      ],
      "infoHotspots": [
        {
          "id": "c2",
          "yaw": 2.1618695751802424,
          "pitch": 0.41387735007271154,
          "title": "Коктейль 2",
          "subtitle": "Цитрус & пряности",
          "image": "img/cocktails/cocktail-3.gif",
          "description": "Свежий цитрусовый коктейль с пряным послевкусием. Хорошо сочетается с закусками и морепродуктами.",
          "tags": ["citrus", "balanced", "signature"],
          "strength": "Средний",
          "price": "14€",
          "orderUrl": "#order-c2"
        }
      ]
    },
    {
      "id": "2-terrace-pancam003_people",
      "name": "Terrace PanCam003_People",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        }
      ],
      "faceSize": 2048,
      "initialViewParameters": {
        "pitch": 0,
        "yaw": 0,
        "fov": 1.5707963267948966
      },
      "linkHotspots": [
        {
          "yaw": 2.8323923602586047,
          "pitch": 0.013739101570951817,
          "rotation": 0,
          "target": "1-terrace-pancam002-people"
        },
        {
          "yaw": -2.1990193235914095,
          "pitch": -0.0005041299815058409,
          "rotation": 0,
          "target": "0-terrace-pancam001_people"
        }
      ],
      "infoHotspots": [
        {
          "id": "c1",
          "yaw": 2.190477920532844,
          "pitch": 0.5031513146167654,
          "title": "Коктейль 1",
          "subtitle": "Крепкий классик",
          "image": "img/cocktails/cocktail-1.gif",
          "description": "Крепкий, сухой и максимально " +
                         "взрослый" +
                         ". Для тех, кто любит классику и чистый вкус.",
          "tags": ["strong", "dry", "classic"],
          "strength": "Крепкий",
          "price": "15€",
          "orderUrl": "#order-c1"
        }
      ]
    }
  ],
  "name": "Find your cocktail",
  "settings": {
    "mouseViewMode": "drag",
    "autorotateEnabled": false,
    "fullscreenButton": false,
    "viewControlButtons": false
  }
};
