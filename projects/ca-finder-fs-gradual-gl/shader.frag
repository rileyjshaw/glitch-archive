precision highp float;
varying vec2 texCoords;
uniform sampler2D textureSampler;
uniform float timestamp;

// Image “cycle” effect.
float filledFactor = 0.5;
float pixelRange = filledFactor * 127.5;
void main() {
  // Get the current pixel’s luminance.
  float lum = texture2D(textureSampler, texCoords).r * 255.0;

  // Create a moving “luminance target” that loops from 0 to 255.
  float target = mod(timestamp / 50.0, 255.0);

  // Highlight anything within range of the target…
  float dist = abs(lum - target);
  // …including anything that crosses the 255-0 boundary.
  dist = abs(mod(dist + 128.0, 255.0) - 128.0);

  // The pixel will be #1c1c19 if its within range, or transparent otherwise.
  float isForeground = step(dist, pixelRange);
  gl_FragColor = vec4(0.11, 0.11, 0.098, 1.0) * isForeground;
}
