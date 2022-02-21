attribute vec3 vertexPosition;
attribute vec3 vertexNormal;
uniform mat4 worldMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

varying lowp vec3 vNormal;
varying lowp vec3 vFragmentPosition;

void main() {
    vNormal = vertexNormal;

    lowp vec4 worldPosition = worldMatrix * vec4(vertexPosition, 1.0);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
    vFragmentPosition = vec3(worldPosition);
}
