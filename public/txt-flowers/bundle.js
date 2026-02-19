/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./app/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./app/index.js":
/*!**********************!*\
  !*** ./app/index.js ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("var WIDTH = Math.ceil(window.innerWidth / 14);\nvar HEIGHT = Math.ceil(window.innerHeight / 14);\nvar directions = [-1, 0, 0, 0, 1];\nvar stems = {\n  '-1': '\\\\',\n  '0': '|',\n  '1': '/'\n};\nvar tops = ['🌼', '🌸', '🌹', '🌷', '🌻', '🌺'];\nvar flowers = Array.from({\n  length: WIDTH\n}, function (_, x) {\n  return Math.random() < 0.67 ? null : {\n    x: x,\n    y: 0,\n    top: tops[Math.floor(Math.random() * tops.length)]\n  };\n}).filter(function (f) {\n  return f;\n});\nvar garden = document.createElement('div');\ngarden.classList.add('garden');\nvar columns = Array.from({\n  length: WIDTH\n}, function () {\n  var column = document.createElement('div');\n  column.classList.add('column');\n  var squares = Array.from({\n    length: HEIGHT\n  }, function () {\n    var square = document.createElement('div');\n    square.classList.add('square');\n    return square;\n  });\n\n  for (var _i = 0; _i < squares.length; _i++) {\n    var square = squares[_i];\n    column.appendChild(square);\n  }\n\n  garden.appendChild(column);\n  return squares;\n});\n\nfunction grow(flower, first) {\n  var x = flower.x,\n      y = flower.y,\n      top = flower.top;\n\n  if (first) {\n    columns[x][y].textContent = '🌱';\n  } else {\n    var direction = directions[Math.floor(Math.random() * directions.length)];\n    var stem = stems[direction];\n    var oldSquare = columns[x][y];\n    oldSquare.textContent = stem;\n    ++y;\n    x += direction;\n\n    if (x >= 0 && x < WIDTH && y < HEIGHT) {\n      var newSquare = columns[x][y];\n      newSquare.textContent = top;\n    }\n\n    flower.x = x;\n    flower.y = y;\n  }\n\n  if (flower.y >= HEIGHT) {\n    flowers.splice(flowers.indexOf(flower), 1);\n  } else window.setTimeout(function () {\n    return grow(flower);\n  }, Math.random() * 50000);\n}\n\n(function seed(first) {\n  if (!first) {\n    var x = Math.floor(Math.random() * WIDTH);\n    var square = columns[x][0];\n\n    if (square.textContent !== '🌱') {\n      var flower = {\n        x: x,\n        y: 0,\n        top: tops[Math.floor(Math.random() * tops.length)]\n      };\n      flowers.push(flower);\n      grow(flower, true);\n    }\n  }\n\n  window.setTimeout(seed, Math.random() * 20000);\n})(true);\n\ndocument.body.appendChild(garden);\nflowers.forEach(function (flower) {\n  return grow(flower, true);\n});\n\n//# sourceURL=webpack:///./app/index.js?");

/***/ })

/******/ });