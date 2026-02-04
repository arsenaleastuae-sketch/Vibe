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
          "yaw": -2.5473427290485002,
          "pitch": 0.38837209783072524,
          "title": "Коктель 3",
          "text": "Text"
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
          "yaw": 2.1618695751802424,
          "pitch": 0.41387735007271154,
          "title": "Коктель 2",
          "text": "Text"
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
          "yaw": 2.190477920532844,
          "pitch": 0.5031513146167654,
          "title": "Коктель 1",
          "text": "Text"
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
