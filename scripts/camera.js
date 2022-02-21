const ORIGIN = vec3.fromValues(0.0, 0.0, 0.0);
const FORWARD_VEC = vec3.fromValues(0.0, 0.0, -1.0);
const RIGHT_VEC = vec3.fromValues(1.0, 0.0, 0.0);
const DOWN_VEC = vec3.fromValues(0.0, -1.0, 0.0);
const DEFAULT_DIST = 10.0;

function radians(degrees) {
    return degrees * (Math.PI/180);
}

class Camera {

    // for yaw, pitch calculations
    currDist = DEFAULT_DIST;
    pitchAngle = 0.0;
    yawAngle = 0.0;

    constructor(canvas, sensitivity, speed,
                fov, aspect, zNear, zFar) {
        this.sensitivity = sensitivity;
        this.speed = speed;
        this.projectionMatrix = mat4.create();
        mat4.perspective(this.projectionMatrix,
                         fov,
                         aspect,
                         zNear,
                         zFar);

        // Input Handling

        //Camera movement
        canvas.addEventListener("mousemove", (e) => {
            this.#yaw(this.sensitivity * e.movementX)
            this.#pitch(-1.0 * this.sensitivity * e.movementY);
        })

        //Camera zoom
        canvas.addEventListener("wheel", (e) => {
            this.#zoom(0.01 * e.deltaY);
        })
    }

    viewMatrix(){
        var mat = mat4.create();

        // Translate space so that camera is at the origin
        const translation = vec3.create();
        vec3.scale(translation, FORWARD_VEC, this.currDist);
        mat4.translate(mat, mat, translation);

        // Pitch according to cursor position
        mat4.rotate(mat, mat, radians(this.pitchAngle), RIGHT_VEC);

        // Yaw according to cursor position
        mat4.rotate(mat, mat, radians(this.yawAngle), DOWN_VEC);

        return mat;
    }

    // Get position of camera in world space
    position(){
        const inv = mat4.create();

        mat4.invert(inv, this.viewMatrix());
        const pos = vec3.create();

        mat4.getTranslation(pos, inv);
        return pos;
    }

    #yaw(angle) {
        this.yawAngle -= angle;
        if (this.yawAngle > 360.0)
            this.yawAngle -= 360.0;
        if (this.yawAngle < -360.0)
            this.yawAngle += 360.0;
    }

    #pitch(angle) {
        this.pitchAngle -= angle;
        if (this.pitchAngle > 89.0)
            this.pitchAngle = 89.0;
        if (this.pitchAngle < -89.0)
            this.pitchAngle = -89.0;
    }

    #zoom(amount) {
        this.currDist += amount;
        if (this.currDis > 30.0)
            this.currDist = 30.0;
        if (this.currDist < 0.7)
            this.currDist = 0.7;
    }


}
