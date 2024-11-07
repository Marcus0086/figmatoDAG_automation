const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"

const BROWSER_VNC_URL = process.env.BROWSER_VNC_URL || "http://127.0.0.1:6080";
const LAMBDA_FUNCTION_URL = process.env.LAMBDA_FUNCTION_URL || "http://localhost:3000";
const ENV = process.env.NODE_ENV;

const BROWSER_ARGS = [
  "--use-gl=angle", // Enable WebGL using ANGLE
  "--use-angle=gl-egl", // Use ANGLE (OpenGL)
];

const INTERACTION_TYPES = {
  ON_CLICK: "click",
  ON_HOVER: "hover",
  DRAG: "drag",
  ON_KEY_PRESS: "type",
  MOUSE_UP: "mouseup",
  MOUSE_DOWN: "mousedown",
  ON_SCROLL: "scroll",
};

export { USER_AGENT, BROWSER_ARGS, BROWSER_VNC_URL, ENV, LAMBDA_FUNCTION_URL, INTERACTION_TYPES };
