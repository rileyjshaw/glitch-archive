attribute vec2 position;
varying vec2 texCoords;
uniform float timestamp;

// This is a simple one: draw two triangles, map a texture to it, and flip the
// Y axis to draw the texture upright.
// Source: https://medium.com/eureka-engineering/image-processing-with-webgl-c2af552e8df0
void main() {
  texCoords = (position + 1.0) / 2.0;
  texCoords.y = 1.0 - texCoords.y;
  gl_Position = vec4(position, 0, 1.0);
}
