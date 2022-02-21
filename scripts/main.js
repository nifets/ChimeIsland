main();

function load_resources() {
    var promises = []

    promises.push(fetch("shaders/normal.vert").then(res => res.text()),
                  fetch("shaders/normal.frag").then(res => res.text()),
                  fetch("shaders/cel.vert").then(res => res.text()),
                  fetch("shaders/cel.frag").then(res => res.text()),
                  fetch("shaders/post.vert").then(res => res.text()),
                  fetch("shaders/post.frag").then(res => res.text()),
                  fetch("models/chime_clothes.obj").then(res => res.text()),
                  fetch("models/chime_eyes.obj").then(res => res.text()),
                  fetch("models/chime_face.obj").then(res => res.text()),
                  fetch("models/chime_lanturns.obj").then(res => res.text()),
                  fetch("models/chime_limbs.obj").then(res => res.text()),
                  fetch("models/island_crystals.obj").then(res => res.text()),
                  fetch("models/island_rocks.obj").then(res => res.text()))

    return Promise.all(promises)
                  .then(res => ({"shaderNormalVert": res[0],
                                 "shaderNormalFrag": res[1],
                                 "shaderCelVert": res[2],
                                 "shaderCelFrag": res[3],
                                 "shaderPostVert": res[4],
                                 "shaderPostFrag": res[5],
                                 "chimeClothesSrc": res[6],
                                 "chimeEyesSrc": res[7],
                                 "chimeFaceSrc": res[8],
                                 "chimeLanturnsSrc": res[9],
                                 "chimeLimbsSrc": res[10],
                                 "islandCrystalsSrc": res[11],
                                 "islandRocksSrc": res[12]
                                }))
}


function main() {
    // Get reference to canvas
    const canvas = document.querySelector("#glCanvas");

    // Initialize the GL context
    const gl = WebGLDebugUtils.makeDebugContext(canvas.getContext("webgl2", {antialias: false}));
    if (!gl) {
        alert("Unable to initialize WebGL");
        return;
    }

    // Input handling setup
    canvas.setAttribute("tabindex", 0);
    canvas.requestPointerLock = canvas.requestPointerLock ||
                                canvas.mozRequestPointerLock;
    canvas.onclick = function() {canvas.requestPointerLock();};

    // Load resources and start rendering the scene
    load_resources().then(res => draw_scene(gl, canvas, res))
}

function draw_scene(gl, canvas, res) {

    // OpenGL configuration
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.depthFunc(gl.LEQUAL);

    // Load shader programs from shader source code

    // Program for rendering colours from normals for edge detection
    normalVert = res["shaderNormalVert"];
    normalFrag = res["shaderNormalFrag"];
    const normalProgram = new Program(gl, normalVert, normalFrag,
                                      ["vertexPosition", "vertexNormal"],
                                      ["projectionMatrix", "viewMatrix",
                                       "worldMatrix"]);

    // Program for rendering a cel-shaded view of the scene
    celVert = res["shaderCelVert"];
    celFrag = res["shaderCelFrag"];
    const celProgram = new Program(gl, celVert, celFrag,
                                   ["vertexPosition", "vertexNormal"],
                                   ["projectionMatrix", "viewMatrix",
                                    "worldMatrix", "lightPosition[0]",
                                    "lightPosition[1]", "lightPosition[2]",
                                    "lightPosition[3]", "lightPosition[4]",
                                    "viewPosition", "diffuseColour", "ambientColour",
                                    "specularColour", "shininess", "celSteps",
                                    "numOfPointLights"]);

    // Program for doing post-processing
    postVert = res["shaderPostVert"];
    postFrag = res["shaderPostFrag"];
    const postProgram = new Program(gl, postVert, postFrag,
                                    ["vertexPosition"],
                                    ["normalSampler", "celSampler", "textureSize"]);

    // Used to render the processed images on screen
    const screenQuadBuffer = gl.createBuffer();
    {
        const screenQuadBufferData = new Float32Array([
            -1.0, -1.0,
             1.0, -1.0,
            -1.0,  1.0,
            -1.0,  1.0,
             1.0, -1.0,
             1.0,  1.0]);

        gl.bindBuffer(gl.ARRAY_BUFFER, screenQuadBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, screenQuadBufferData, gl.STATIC_DRAW);
    }

    // Create viewing camera
    const camera = new Camera(canvas, sensitivity = 0.1, speed = 0.1,
                              fov = 60 * Math.PI / 180,
                              aspect = gl.canvas.clientWidth / gl.canvas.clientHeight,
                              zNear = 0.1, zFar = 100.0);

    // Create point lights
    const lightPosition = Array();
    lightPosition[0] = vec3.fromValues(0.04, 0.44, 0.07);
    lightPosition[1] = vec3.fromValues(0.56, -0.13, -0.63);
    lightPosition[2] = vec3.fromValues(-0.22, 0.01, -0.92);
    lightPosition[3] = vec3.fromValues(-0.6, 1.5, 1.6);

    // Load models
    const chimeTransform = mat4.create();
    {
        const transVec = vec3.fromValues(0.0, -0.5, 0.0);
        mat4.translate(chimeTransform, chimeTransform, transVec);
    }
    const chime = new Model(gl, chimeTransform,
                    [new Mesh(gl, res["chimeClothesSrc"],
                              new Material(vec3.fromValues(0.09, 0.06, 0.06),
                                           vec3.fromValues(0.22, 0.18, 0.14),
                                           vec3.fromValues(0.2, 0.2, 0.2),
                                           6.2, 7.0)),
                     new Mesh(gl, res["chimeFaceSrc"],
                              new Material(vec3.fromValues(0.1, 0.18, 0.17),
                                           vec3.fromValues(0.4, 0.75, 0.69),
                                           vec3.fromValues(0.29, 0.50, 0.50),
                                           10.0, 5.0)),
                     new Mesh(gl, res["chimeEyesSrc"],
                              new Material(vec3.fromValues(0.03, 0.03, 0.03),
                                           vec3.fromValues(0.1, 0.1, 0.1),
                                           vec3.fromValues(50.0, 50.0, 45.0),
                                           108.0, 3.0)),
                     new Mesh(gl, res["chimeLimbsSrc"],
                              new Material(vec3.fromValues(0.0, 0.06, 0.1),
                                           vec3.fromValues(0.0, 0.49, 0.58),
                                           vec3.fromValues(0.3, 0.3, 0.3),
                                           7.0, 5.0)),
                     new Mesh(gl, res["chimeLanturnsSrc"],
                              new Material(vec3.fromValues(1.0, 1.0, 0.8),
                                           vec3.fromValues(0.0, 0.0, 0.0),
                                           vec3.fromValues(0.01, 0.01, 0.01),
                                           0.0, 5.0))
                    ]);

    const islandTransform = mat4.create();
    {
        const transVec = vec3.fromValues(0.0, -0.5, 0.0);
        mat4.translate(islandTransform, islandTransform, transVec);
    }
    const island = new Model(gl, islandTransform,
                        [new Mesh(gl, res["islandRocksSrc"],
                                  new Material(vec3.fromValues(0.05, 0.04, 0.06),
                                               vec3.fromValues(0.42, 0.39, 0.39),
                                               vec3.fromValues(0.13, 0.12, 0.14),
                                               18.0, 8.0)),
                         new Mesh(gl, res["islandCrystalsSrc"],
                                  new Material(vec3.fromValues(0.17, 0.02, 0.17),
                                               vec3.fromValues(0.7, 0.07, 0.58),
                                               vec3.fromValues(0.8, 0.8, 0.6),
                                               40.0, 10.0))
                        ]);

    // Set up framebuffers for rendering to textures
    // So that we can do post processing

    // Create a framebuffer for rendering the normals in the scene
    const normalRenderTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, normalRenderTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.canvas.clientWidth,
                  gl.canvas.clientHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const normalFrameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, normalFrameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                            gl.TEXTURE_2D, normalRenderTexture, 0);
    //For depth testing
    {
        const depthBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16,
                               gl.canvas.clientWidth, gl.canvas.clientHeight);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
                                   gl.RENDERBUFFER, depthBuffer);
    }

    // Create a framebuffer for rendering the cel shaded scene
    // This time we also create a framebuffer for antialiasing
    const celRenderTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, celRenderTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.canvas.clientWidth,
                  gl.canvas.clientHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const renderFrameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, renderFrameBuffer);
    {
        //Colour attachment before antialiasing
        const colourBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, colourBuffer);
        const samples = gl.getParameter(gl.MAX_SAMPLES);
        gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.RGBA8,
                               gl.canvas.clientWidth, gl.canvas.clientHeight);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                                   gl.RENDERBUFFER, colourBuffer);

        //For depth testing
        const depthBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
        gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.DEPTH_COMPONENT16,
                               gl.canvas.clientWidth, gl.canvas.clientHeight);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
                                   gl.RENDERBUFFER, depthBuffer);
    }

    // Attach target texture to antialiasing framebuffer
    const colourFrameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, colourFrameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                            gl.TEXTURE_2D, celRenderTexture, 0);

    // Rendering Loop
    function render(now) {

        normalProgram.use(gl);
        // render to our targetTexture by binding the framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, normalFrameBuffer);

        // Clear buffer
        gl.enable(gl.DEPTH_TEST);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT| gl.DEPTH_BUFFER_BIT);

        // Specify projection matrix value in shader program
        gl.uniformMatrix4fv(normalProgram.uniformLoc["projectionMatrix"],
                            false, camera.projectionMatrix);

        // Update view matrix
        gl.uniformMatrix4fv(normalProgram.uniformLoc["viewMatrix"],
                            false,
                            camera.viewMatrix());
        // Draw models
        island.draw(gl, normalProgram, false);
        chime.draw(gl, normalProgram, false);

        normalProgram.unuse(gl);

        //-------------------------------------

        celProgram.use(gl);
        // render to our targetTexture by binding the framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, renderFrameBuffer);

        // Clear buffer
        gl.enable(gl.DEPTH_TEST);
        gl.clearColor(0.09, 0.03, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT| gl.DEPTH_BUFFER_BIT);

        // Specify projection matrix value in shader program
        gl.uniformMatrix4fv(celProgram.uniformLoc["projectionMatrix"],
                            false, camera.projectionMatrix);

        // Update view matrix
        gl.uniformMatrix4fv(celProgram.uniformLoc["viewMatrix"],
                            false,
                            camera.viewMatrix());

        // Update view position
        const viewPosition = camera.position();
        gl.uniform3f(celProgram.uniformLoc["viewPosition"],
                     viewPosition[0], viewPosition[1], viewPosition[2]);

        // Update light positions
        lightPosition[4] = viewPosition;
        for (let i = 0; i < 5; i++){
            gl.uniform3f(celProgram.uniformLoc["lightPosition[" + i + "]"],
                         lightPosition[i][0], lightPosition[i][1],
                         lightPosition[i][2]);
        }
        gl.uniform1f(celProgram.uniformLoc["numOfPointLights"], 5);

        // Draw models
        island.draw(gl, celProgram, true);
        chime.draw(gl, celProgram, true);

        celProgram.unuse(gl);

        // "blit" the render buffer onto the colour buffer, adding AA
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, renderFrameBuffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, colourFrameBuffer);
        gl.clearBufferfv(gl.COLOR, 0, [1.0, 1.0, 1.0, 1.0]);
        gl.blitFramebuffer(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight,
                           0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight,
                           gl.COLOR_BUFFER_BIT, gl.LINEAR);

        //-------------------------------------


        postProgram.use(gl);
        gl.bindFramebuffer(gl.FRAMEBUFFER, renderFrameBuffer);

        // Clear buffer
        gl.disable(gl.DEPTH_TEST);
        gl.clearColor(1, 1, 0.2, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.bindBuffer(gl.ARRAY_BUFFER, screenQuadBuffer);
        gl.vertexAttribPointer(postProgram.attributeLoc["vertexPosition"], 2,
                               gl.FLOAT, false, 0, 0);

        // Bind textures to shader program
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, normalRenderTexture);
        gl.uniform1i(postProgram.uniformLoc["normalSampler"], 0);


        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, celRenderTexture);
        gl.uniform1i(postProgram.uniformLoc["celSampler"], 1);

        gl.uniform2f(postProgram.uniformLoc["textureSize"],
                     gl.canvas.clientWidth, gl.canvas.clientHeight);


        gl.drawArrays(gl.TRIANGLES,0, 6);

        // "blit" the render buffer onto the canvas buffer
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, renderFrameBuffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
        gl.clearBufferfv(gl.COLOR, 0, [1.0, 1.0, 1.0, 1.0]);
        gl.blitFramebuffer(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight,
                           0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight,
                           gl.COLOR_BUFFER_BIT, gl.LINEAR);

        postProgram.unuse(gl);


        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}
