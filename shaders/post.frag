varying lowp vec2 vTexCoords;

uniform lowp vec2 textureSize;
uniform sampler2D normalSampler;
uniform sampler2D celSampler;

const lowp mat3 sobelX = mat3(1.0, 0.0, -1.0,
                              2.0, 0.0, -2.0,
                              1.0, 0.0, -1.0);
const lowp mat3 sobelY = mat3(1.0, 2.0, 1.0,
                              0.0, 0.0, 0.0,
                              -1.0, -2.0, -1.0);

lowp vec4 applyKernel(lowp mat3 kernel, sampler2D sampler, lowp vec2 pixelSize) {
    lowp vec4 colourSum = vec4(0.0,0.0,0.0,0.0);
    for (int i = -1; i <= 1; i++) {
        for (int j = -1; j <= 1; j++) {
            lowp vec2 coordDiff = pixelSize * vec2(float(i), float(j));
            colourSum += texture2D(sampler, vTexCoords + coordDiff) * kernel[i+1][j+1];
        }
    }

    return vec4(colourSum.xyz, 1.0);
}


void main() {
    lowp vec2 pixelSize = vec2(1.0, 1.0) / textureSize;

    lowp vec4 celTex = texture2D(celSampler, vTexCoords);

    lowp vec4 normalTex = texture2D(normalSampler, vTexCoords);

    lowp vec4 gradX = applyKernel(sobelX, normalSampler, pixelSize);
    lowp vec4 gradY = applyKernel(sobelY, normalSampler, pixelSize);

    lowp vec4 grad = sqrt(gradX * gradX + gradY * gradY);

    lowp float edge = (grad.x + grad.y + grad.z) / 6.0;
    lowp vec4 toonTex = celTex - vec4(edge, edge, edge, 0.0);

    gl_FragColor = mix(toonTex, celTex, 0.67);
}
