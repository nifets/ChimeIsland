
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("Could not compile the shader: " + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return;
    }
    return shader;
}

function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert("Could not initialize shader program: "
              + gl.getProgramInfoLog(program));
        return;
    }
    return program;
}

class Program {
    constructor(gl, vsSource, fsSource, attributes, uniforms) {
        this.program = initShaderProgram(gl, vsSource, fsSource);
        this.attributeLoc = {}
        attributes.forEach((item, i) => {
            this.attributeLoc[item] = gl.getAttribLocation(this.program, item);
        });
        this.uniformLoc = {}
        uniforms.forEach((item, i) => {
            this.uniformLoc[item] = gl.getUniformLocation(this.program, item);
        });

    }

    use(gl) {
        gl.useProgram(this.program);
        for (const k in this.attributeLoc) {
            gl.enableVertexAttribArray(this.attributeLoc[k]);
        }
    }

    unuse(gl) {
        for (const k in this.attributeLoc) {
            gl.disableVertexAttribArray(this.attributeLoc[k]);
        }
    }
}
