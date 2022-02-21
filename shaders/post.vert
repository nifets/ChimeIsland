attribute vec2 vertexPosition;

varying lowp vec2 vTexCoords;

void main() {
    vTexCoords = vec2(0.5,0.5) * vertexPosition + vec2(0.5,0.5);
    gl_Position = vec4(vertexPosition, 0.0, 1.0);
}
