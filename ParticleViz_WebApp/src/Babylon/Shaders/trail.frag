precision highp float;

uniform sampler2D lastFrame;
uniform sampler2D textureSampler;
varying vec2 vUV;
        //uniform float opacity;

void main(void) {
    vec4 curr = texture2D(textureSampler, vUV);
    vec4 last = texture2D(lastFrame, vUV);
    curr.rgb = mix(curr.rgb, last.rgb, 0.9);
    gl_FragColor = curr;
}