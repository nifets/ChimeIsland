attribute vec3 vertexPosition;
attribute vec3 vertexNormal;
uniform mat4 worldMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

varying lowp vec4 vColor;

void main() {
    vColor = vec4(normalize(1.0 + vertexNormal), 1.0);
    gl_Position = projectionMatrix * viewMatrix * worldMatrix * vec4(vertexPosition, 1.0);
}
