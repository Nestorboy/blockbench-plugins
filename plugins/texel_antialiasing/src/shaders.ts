export function getTexelVertProgram(useAntiAliasing: boolean): string {
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

export function getTexelFragProgram(useAntiAliasing: boolean): string {
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

        ${getTexelAAFunction()}

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


export function getUvTexelVertProgram(useAntiAliasing: boolean): string {
    return `
        attribute float highlight;

        uniform bool SHADE;
        uniform float DENSITY;

        ${useAntiAliasing ? 'centroid' : ''} varying vec2 vUv;
        varying float light;
        varying float lift;

        float AMBIENT = 0.1;
        float XFAC = -0.05;
        float ZFAC = 0.05;

        void main()
        {
            if (SHADE) {
                vec3 N = normalize( vec3( modelMatrix * vec4(normal, 0.0) ) );

                light = (0.2 + abs(N.z) * 0.8) * (1.0-AMBIENT) + N.x*N.x * XFAC + N.y*N.y * ZFAC + AMBIENT;
            } else {
                light = 1.0;
            }

            if (highlight == 2.0) {
                lift = 0.3;
            } else if (highlight == 1.0) {
                lift = 0.12;
            } else {
                lift = 0.0;
            }

            vUv = uv * DENSITY;
            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
            gl_Position = projectionMatrix * mvPosition;
        }`;
}

export function getUvTexelFragProgram(useAntiAliasing: boolean): string {
    return `
        #ifdef GL_ES
        precision ${isApp ? 'highp' : 'mediump'} float;
        #endif

        uniform sampler2D map;

        uniform bool SHADE;

        // x: width
        // y: height
        // z: 1.0 / width
        // w: 1.0 / height
        uniform vec4 RESOLUTION;

        ${useAntiAliasing ? 'centroid' : ''} varying vec2 vUv;
        varying float light;
        varying float lift;

        ${getTexelAAFunction()}

        void main(void)
        {
            vec2 uv = ${useAntiAliasing ? 'TexelAA(vUv, RESOLUTION)' : 'vUv'};

            vec4 color = texture2D(map, uv);
            gl_FragColor = color;
            return;

            if (color.a < 0.01) discard;
            ${useAntiAliasing ? 'color.rgb /= color.a;' : ''}

            gl_FragColor = vec4(lift + color.rgb * light, color.a);

            if (lift > 0.2) {
                gl_FragColor.r = gl_FragColor.r * 0.6;
                gl_FragColor.g = gl_FragColor.g * 0.7;
            }
        }`;
}

function getTexelAAFunction(): string {
    console.log(settings.texel_aa_weight && settings.texel_aa_weight.value);
    return `
        // GLSL implementation of texel anti-aliasing function described by t3ssel8r:
        // https://www.youtube.com/watch?v=d6tp43wZqps
        vec2 TexelAA(vec2 uv, vec4 resolution)
        {
            vec2 boxSize = clamp(fwidth(uv) * resolution.xy, vec2(1e-5), vec2(1.0));
            vec2 tx = uv * resolution.xy - 0.5 * boxSize;
            ${settings.texel_aa_weight && settings.texel_aa_weight.value ?
                'vec2 offset = smoothstep(1.0 - boxSize, vec2(1.0), fract(tx)); // Weighted center.' :
                'vec2 offset = clamp((fract(tx) - (1.0 - boxSize)) / boxSize, 0.0, 1.0); // Perfectly linear.'
            }
            return (floor(tx) + 0.5 + offset) * resolution.zw;
        }`;
}
