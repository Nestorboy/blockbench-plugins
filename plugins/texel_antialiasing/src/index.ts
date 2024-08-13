import packageJson from './package.json';
import { getTexelVertProgram, getTexelFragProgram } from './shaders';

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
    }
));

function addTextureEvent(data: {texture: Texture}) {
    let tex: Texture = data.texture;
    applyAAShaderOnTextureLoad(Project, tex);
}

function applyAAShaderToAll(useAntiAliasing: boolean): void {
    ModelProject?.all.forEach(project => {
        if (!project) return;

        applyAAShaderToProject(useAntiAliasing, project);
    });
}

function applyAAShaderToProject(useAntiAliasing: boolean, project: ModelProject) {
    project.textures.forEach(tex => {
        applyAAShader(project, tex, useAntiAliasing);
    })
}

function applyAAShaderOnTextureLoad(project: ModelProject, tex: Texture, useAntiAliasing: boolean = true) {
    // Append to possibly assigned onload callback.
    tex.img.onload = (pre => {
        return () => {
            pre && pre.apply(this, arguments);

            applyAAShader(project, tex, useAntiAliasing);
        }
    })(tex.img.onload);
}

function applyAAShader(project: ModelProject, tex: Texture, useAntiAliasing: boolean = true) {
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
