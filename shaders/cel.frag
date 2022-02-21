#define MAX_LIGHTS 30

//light attenuation constants
#define celSmoothness 0.01
#define constant 1.4
#define linear 0.1
#define quadratic 0.8
const lowp vec3 lightColour = vec3(1.0, 1.0, 0.9);

varying lowp vec3 vNormal;
varying lowp vec3 vFragmentPosition;

uniform lowp vec3 viewPosition;
uniform lowp vec3 lightPosition[MAX_LIGHTS];
uniform lowp vec3 diffuseColour;
uniform lowp vec3 ambientColour;
uniform lowp vec3 specularColour;
uniform lowp float shininess;
uniform lowp float celSteps; //number of cel shading steps
uniform lowp float numOfPointLights;

void main() {
    lowp vec3 viewDir = normalize(viewPosition - vFragmentPosition);

    lowp vec3 colour = vec3(0.0, 0.0, 0.0);
    for (int i = 0; i < MAX_LIGHTS; i++) {
        if (i >= int(numOfPointLights)) {
            break;
        }
        lowp vec3 lightPos = lightPosition[i];
        lowp vec3 lightDir = normalize(lightPos - vFragmentPosition);

        // Compute diffuse component
        lowp float diffuseStrength = max(dot(vNormal, lightDir), 0.0);
        lowp vec3 diffuse = diffuseStrength * diffuseColour;

        // Compute specular component
        lowp vec3 halfwayDir = normalize(lightDir + viewDir);
        lowp float specularStrength = pow(max(dot(vNormal, halfwayDir), 0.0), shininess);
        lowp vec3 specular = vec3(0.0, 0.0, 0.0);
        if (shininess > 0.0)
            specular = specularStrength * specularColour;
        else
            specular = lightColour;

        //attenuate light strength based on the dist from light source
        lowp float dist = length(lightPos - vFragmentPosition);
        lowp float attenuation = 1.0 / (constant + linear * dist + quadratic * dist * dist);

        colour += lightColour * (diffuse + specular) * attenuation;
    }

    // Apply cel shading
    lowp float intensity = sqrt(length(colour)) * celSteps;
    intensity = (floor(intensity) + smoothstep(0.5 - celSmoothness/2.0, 0.5 + celSmoothness/2.0, fract(intensity))) / celSteps;
    intensity *= intensity;

    colour = intensity * normalize(colour);
    for (int i = 0; i < 3; i++)
        colour[i] = max(0.0, colour[i]);

    gl_FragColor = vec4(colour + ambientColour, 1.0);
}
