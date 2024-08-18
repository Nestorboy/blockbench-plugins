import packageJson from './package.json';
import { getTexelVertProgram, getTexelFragProgram, getUvTexelVertProgram, getUvTexelFragProgram } from './shaders';

const {name: name, blockbenchConfig } = packageJson;

let deletables : Deletable[] = [];

BBPlugin.register(name, Object.assign({},
    blockbenchConfig as typeof blockbenchConfig & {
        tags: ["Blockbench", "Shader"],
        variant: 'both'
    },
    {
        onload() {
            Blockbench.on('add_texture', addTextureEvent);

            deletables.push(new Setting('texel_aa_weight', {
                name: 'Weighted Center',
                category: 'preview',
                description: 'Adds a bias to reduce how much anti-aliasing there is, making it a bit less blurry.',
                // @ts-expect-error
                type: 'toggle',
                value: 'true',
                onChange: () => {
                    replaceAllPreviewShaders(true);
                    replaceUvShaders(true);
                }
            }));

            replaceAllPreviewShaders(true);
            replaceUvShaders(true);
        },

        onunload() {
            deletables.forEach(action => {
                action.delete();
            });

            // @ts-expect-error
            Blockbench.removeListener('add_texture', addTextureEvent);

            replaceAllPreviewShaders(false);
            replaceUvShaders(false);
        }
    }
));

function addTextureEvent(data: {texture: Texture}) {
    let tex: Texture = data.texture;
    replacePreviewShaderOnTextureLoad(Project, tex);
}

function replaceAllPreviewShaders(useAntiAliasing: boolean): void {
    ModelProject?.all.forEach(project => {
        if (!project) return;

        replacePreviewShadersInProject(useAntiAliasing, project);
    });
}

function replacePreviewShadersInProject(useAntiAliasing: boolean, project: ModelProject) {
    project.textures.forEach(tex => {
        replacePreviewShaders(project, tex, useAntiAliasing);
    })
}

function replacePreviewShaderOnTextureLoad(project: ModelProject, tex: Texture, useAntiAliasing: boolean = true) {
    // Append to possibly assigned onload callback.
    tex.img.onload = (pre => {
        return () => {
            pre && pre.apply(this, arguments);

            replacePreviewShaders(project, tex, useAntiAliasing);
        }
    })(tex.img.onload);
}

function replacePreviewShaders(project: ModelProject, tex: Texture, useAntiAliasing: boolean = true) {
    const filter = useAntiAliasing ? THREE.LinearFilter : THREE.NearestFilter;

    let width = tex.width;
    let height = tex.height;
    if (width === 0 || height === 0) return;

    let threeTex = tex.img.tex;
    threeTex.minFilter = filter;
    threeTex.magFilter = filter;
    threeTex.needsUpdate = true;

    const vertShader = getTexelVertProgram(useAntiAliasing);
    const fragShader = getTexelFragProgram(useAntiAliasing);

    let mat = project.materials[tex.uuid];
    mat.vertexShader = vertShader;
    mat.fragmentShader = fragShader;

    let resolution = new THREE.Vector4(width, height, 1 / width, 1 / height);
    mat.uniforms.RESOLUTION = new THREE.Uniform(resolution);

    mat.needsUpdate = true;
}

function replaceUvShaders(useAntiAliasing: boolean = true) {
    let mat = Canvas.uvHelperMaterial;
    if (!mat) return;

    let tex : THREE.Texture = mat.uniforms.map.value;
    let width = tex.image.width;
    let height = tex.image.height;
    if (width === 0 || height === 0) return;

    const filter = useAntiAliasing ? THREE.LinearFilter : THREE.NearestFilter;
    tex.minFilter = filter;
    tex.magFilter = filter;
    tex.needsUpdate = true;

    mat.vertexShader = getUvTexelVertProgram(useAntiAliasing);
    mat.fragmentShader = getUvTexelFragProgram(useAntiAliasing);

    let resolution = new THREE.Vector4(width, height, 1 / width, 1 / height);
    mat.uniforms.RESOLUTION = new THREE.Uniform(resolution);

    mat.needsUpdate = true;
}
