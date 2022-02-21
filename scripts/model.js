class Material {
    constructor(ambient, diffuse, specular, shininess, celSteps) {
        this.ambient =  ambient;
        this.diffuse = diffuse;
        this.specular = specular;
        this.shininess = shininess;
        this.celSteps = celSteps;
    }

    applyUniform(gl, program) {
        gl.uniform3f(program.uniformLoc["ambientColour"],
                    this.ambient[0], this.ambient[1], this.ambient[2]);
        gl.uniform3f(program.uniformLoc["diffuseColour"],
                     this.diffuse[0], this.diffuse[1], this.diffuse[2]);
        gl.uniform3f(program.uniformLoc["specularColour"],
                     this.specular[0], this.specular[1], this.specular[2]);
        gl.uniform1f(program.uniformLoc["shininess"], this.shininess);
        gl.uniform1f(program.uniformLoc["celSteps"], this.celSteps);
    }
}

class Mesh {
    constructor(gl, source, material) {
        this.mesh = new OBJ.Mesh(source);
        this.material = material;
        OBJ.initMeshBuffers(gl, this.mesh);
    }
    draw(gl, program, withMaterial) {
        //Bind position buffer to the program attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
        gl.vertexAttribPointer(program.attributeLoc["vertexPosition"],
                               this.mesh.vertexBuffer.itemSize,
                               gl.FLOAT, false, 0, 0);

        //Bind normal buffer to the program attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.normalBuffer);
        gl.vertexAttribPointer(program.attributeLoc["vertexNormal"],
                               this.mesh.normalBuffer.itemSize,
                               gl.FLOAT, false, 0, 0);

        // Update material
        if (withMaterial) {
            this.material.applyUniform(gl, program);
        }

        //Draw the mesh
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.mesh.indexBuffer.numItems,
                        gl.UNSIGNED_SHORT, 0);
    }
}

class Model {
    constructor(gl, worldMatrix, meshes) {
        this.meshes = meshes;
        this.worldMatrix = worldMatrix;
    }

    draw(gl, program, withMaterial) {
        // Update world matrix
        gl.uniformMatrix4fv(program.uniformLoc["worldMatrix"],
                            false,
                            this.worldMatrix);
        this.meshes.forEach(m => m.draw(gl, program, withMaterial));
    }
}
