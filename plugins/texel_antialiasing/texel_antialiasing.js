/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./shaders.ts":
/*!********************!*\
  !*** ./shaders.ts ***!
  \********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getTexelFragProgram: () => (/* binding */ getTexelFragProgram),
/* harmony export */   getTexelVertProgram: () => (/* binding */ getTexelVertProgram)
/* harmony export */ });
function getTexelVertProgram(useAntiAliasing) {
    return `
        attribute float highlight;

        uniform bool SHADE;
        uniform int LIGHTSIDE;

        ${useAntiAliasing ? 'centroid' : ''} varying vec2 vUv;
        varying float light;
        varying float lift;

        float AMBIENT = 0.5;
        float XFAC = -0.15;
        float ZFAC = 0.05;

        void main()
        {
            if (SHADE) {
                vec3 N = normalize( vec3( modelMatrix * vec4(normal, 0.0) ) );

                if (LIGHTSIDE == 1) {
                    float temp = N.y;
                    N.y = N.z * -1.0;
                    N.z = temp;
                }
                if (LIGHTSIDE == 2) {
                    float temp = N.y;
                    N.y = N.x;
                    N.x = temp;
                }
                if (LIGHTSIDE == 3) {
                    N.y = N.y * -1.0;
                }
                if (LIGHTSIDE == 4) {
                    float temp = N.y;
                    N.y = N.z;
                    N.z = temp;
                }
                if (LIGHTSIDE == 5) {
                    float temp = N.y;
                    N.y = N.x * -1.0;
                    N.x = temp;
                }
                float yLight = (1.0+N.y) * 0.5;
                light = yLight * (1.0-AMBIENT) + N.x*N.x * XFAC + N.z*N.z * ZFAC + AMBIENT;
            } else {
                light = 1.0;
            }

            if (highlight == 2.0) {
                lift = 0.22;
            } else if (highlight == 1.0) {
                lift = 0.1;
            } else {
                lift = 0.0;
            }

            vUv = uv;
            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
            gl_Position = projectionMatrix * mvPosition;
        }`;
}
function getTexelFragProgram(useAntiAliasing) {
    return `
        #ifdef GL_ES
        precision ${isApp ? 'highp' : 'mediump'} float;
        #endif

        uniform sampler2D map;

        uniform bool SHADE;
        uniform bool EMISSIVE;
        uniform vec3 LIGHTCOLOR;

        // x: width
        // y: height
        // z: 1.0 / width
        // w: 1.0 / height
        uniform vec4 RESOLUTION;

        ${useAntiAliasing ? 'centroid' : ''} varying vec2 vUv;
        varying float light;
        varying float lift;

        // GLSL implementation of texel anti-aliasing function described by t3ssel8r:
        // https://www.youtube.com/watch?v=d6tp43wZqps
        vec2 TexelAA(vec2 uv, vec4 resolution)
        {
            vec2 boxSize = clamp(fwidth(uv) * resolution.xy, vec2(1e-5), vec2(1.0));
            vec2 tx = uv * resolution.xy - 0.5 * boxSize;
            ${settings.texel_aa_weight && settings.texel_aa_weight.value ?
        'vec2 offset = smoothstep(1.0 - boxSize, vec2(1.0), fract(tx)); // Weighted center.' :
        'vec2 offset = clamp((fract(tx) - (1.0 - boxSize)) / boxSize, 0.0, 1.0); // Perfectly linear.'}
            return (floor(tx) + 0.5 + offset) * resolution.zw;
        }

        void main(void)
        {
            vec2 uv = ${useAntiAliasing ? 'TexelAA(vUv, RESOLUTION)' : 'vUv'};

            vec4 color = texture2D(map, uv);

            if (color.a < 0.01) discard;
            ${useAntiAliasing ? 'color.rgb /= color.a;' : ''}

            if (EMISSIVE == false) {
                gl_FragColor = vec4(lift + color.rgb * light, color.a);
                gl_FragColor.r = gl_FragColor.r * LIGHTCOLOR.r;
                gl_FragColor.g = gl_FragColor.g * LIGHTCOLOR.g;
                gl_FragColor.b = gl_FragColor.b * LIGHTCOLOR.b;
            } else {
                float light_r = (light * LIGHTCOLOR.r) + (1.0 - light * LIGHTCOLOR.r) * (1.0 - color.a);
                float light_g = (light * LIGHTCOLOR.g) + (1.0 - light * LIGHTCOLOR.g) * (1.0 - color.a);
                float light_b = (light * LIGHTCOLOR.b) + (1.0 - light * LIGHTCOLOR.b) * (1.0 - color.a);
                float alpha = ${useAntiAliasing ? 'color.a' : '1.0'};
                gl_FragColor = vec4(lift + color.r * light_r, lift + color.g * light_g, lift + color.b * light_b, alpha);
            }

            if (lift > 0.2) {
                gl_FragColor.r = gl_FragColor.r * 0.6;
                gl_FragColor.g = gl_FragColor.g * 0.7;
            }
        }`;
}


/***/ }),

/***/ "./package.json":
/*!**********************!*\
  !*** ./package.json ***!
  \**********************/
/***/ ((module) => {

module.exports = /*#__PURE__*/JSON.parse('{"name":"texel_antialiasing","version":"1.0.0","author":"Nestorboy","description":"Adds anti-aliasing between texels in the model preview.","private":true,"main":"index.js","license":"MIT","blockbenchConfig":{"title":"Texel Anti-Aliasing","author":"Nestorboy","icon":"icon.png","description":"Adds anti-aliasing between texels in the model preview.","about":"This plugin aims to improve the visual fidelity of the preview models by adding some anti-aliasing between texels.\\n\\nThe anti-aliasing method is heavily inspired by t3ssel8r\'s video [\\"Crafting a Better Shader for Pixel Art Upscaling\\"](https://www.youtube.com/watch?v=d6tp43wZqps).","tags":["Blockbench","Shader"],"version":"1.0.0","min_version":"4.9.0","max_version":"5.0.0","variant":"both","new_repository_format":true,"has_changelog":true},"scripts":{"build":"webpack","watch":"webpack --watch"},"devDependencies":{"blockbench-types":"^4.10.0","ts-loader":"^9.5.1","typescript":"^4.9.5","webpack":"^5.88.2","webpack-cli":"^5.1.4"}}');

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
/*!******************!*\
  !*** ./index.ts ***!
  \******************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _package_json__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./package.json */ "./package.json");
/* harmony import */ var _shaders__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./shaders */ "./shaders.ts");


const { name: name, blockbenchConfig } = _package_json__WEBPACK_IMPORTED_MODULE_0__;
let deletables = [];
BBPlugin.register(name, Object.assign({}, blockbenchConfig, {
    onload() {
        Blockbench.on('add_texture', addTextureEvent);
        deletables.push(new Setting('texel_aa_weight', {
            name: 'Weighted Center',
            category: 'preview',
            description: 'Adds a bias to reduce how much anti-aliasing there is, making it a bit less blurry.',
            // @ts-expect-error
            type: 'toggle',
            value: 'true',
            onChange: () => applyAAShaderToAll(true)
        }));
        applyAAShaderToAll(true);
    },
    onunload() {
        deletables.forEach(action => {
            action.delete();
        });
        // @ts-expect-error
        Blockbench.removeListener('add_texture', addTextureEvent);
        applyAAShaderToAll(false);
    }
}));
function addTextureEvent(data) {
    let tex = data.texture;
    applyAAShaderOnTextureLoad(Project, tex);
}
function applyAAShaderToAll(useAntiAliasing) {
    ModelProject === null || ModelProject === void 0 ? void 0 : ModelProject.all.forEach(project => {
        if (!project)
            return;
        applyAAShaderToProject(useAntiAliasing, project);
    });
}
function applyAAShaderToProject(useAntiAliasing, project) {
    project.textures.forEach(tex => {
        applyAAShader(project, tex, useAntiAliasing);
    });
}
function applyAAShaderOnTextureLoad(project, tex, useAntiAliasing = true) {
    // Append to possibly assigned onload callback.
    tex.img.onload = (pre => {
        return () => {
            pre && pre.apply(this, arguments);
            applyAAShader(project, tex, useAntiAliasing);
        };
    })(tex.img.onload);
}
function applyAAShader(project, tex, useAntiAliasing = true) {
    const filter = useAntiAliasing ? THREE.LinearFilter : THREE.NearestFilter;
    let width = tex.width;
    let height = tex.height;
    if (width === 0 || height === 0)
        return;
    let threeTex = tex.img.tex;
    threeTex.minFilter = filter;
    threeTex.magFilter = filter;
    threeTex.needsUpdate = true;
    const vertShader = (0,_shaders__WEBPACK_IMPORTED_MODULE_1__.getTexelVertProgram)(useAntiAliasing);
    const fragShader = (0,_shaders__WEBPACK_IMPORTED_MODULE_1__.getTexelFragProgram)(useAntiAliasing);
    let mat = project.materials[tex.uuid];
    mat.vertexShader = vertShader;
    mat.fragmentShader = fragShader;
    let resolution = new THREE.Vector4(width, height, 1 / width, 1 / height);
    mat.uniforms.RESOLUTION = new THREE.Uniform(resolution);
    mat.needsUpdate = true;
}

/******/ })()
;