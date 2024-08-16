import { SPICE_MOUSE_BUTTON, SPICE_MOUSE_BUTTON_MASK } from "./common";


/**
 * ButtonsState type which represent the combination of buttons mask.
 */
export type ButtonsState = number;

/**
 * Initial ButtonsState.
 */
export const ButtonsStateEmpty: ButtonsState = 0;

/**
 * Sets the button mask and returns the new ButtonsState.
 * @param buttonsState the state to change.
 * @param mask the button mask to set.
 * @returns the new state after setting the mask.
 */
export function mouseButtonsStateSet(buttonsState: ButtonsState, mask: SPICE_MOUSE_BUTTON_MASK): ButtonsState {
  return buttonsState |= mask;
}

/**
 * Unsets the button mask and returns the new ButtonsState.
 * @param buttonsState the state to change.
 * @param mask the button mask to unset.
 * @returns the new state after unsetting the mask.
 */
export function mouseButtonsStateUnset(buttonsState: ButtonsState, mask: SPICE_MOUSE_BUTTON_MASK) : ButtonsState {
  return buttonsState &= ~mask;
}

/**
 * Converts the browser mouse button to the corresponding spice mouse button.
 * @param browserButton browser mouse button.
 * @returns the corresponding SPICE_MOUSE_BUTTON.
 */
export function browserMouseButtonToSpiceMouseButton(browserButton: number): SPICE_MOUSE_BUTTON | null {
    switch (browserButton) {
      case 0:
        return SPICE_MOUSE_BUTTON.LEFT;
      case 1:
        return SPICE_MOUSE_BUTTON.MIDDLE;
      case 2:
        return SPICE_MOUSE_BUTTON.RIGHT;
        default:
          return null;
        }
      }
      
  //TODO mouse wheel 
  // case :
  //   return SPICE_MOUSE_BUTTON.UP;
  // case :
  //   return SPICE_MOUSE_BUTTON.DOWN
  
  /**
   * Converts the browser mouse button to the corresponding spice mouse button mask.
   * @param browserButton browser mouse button.
   * @returns the corresponding SPICE_MOUSE_BUTTON_MASK.
   */
  export function browserMouseButtonToSpiceMouseButtonMask(browserButton: number): SPICE_MOUSE_BUTTON_MASK | null {
    switch (browserButton) {
      case 0:
        return SPICE_MOUSE_BUTTON_MASK.LEFT;
      case 1:
        return SPICE_MOUSE_BUTTON_MASK.MIDDLE;
      case 2:
        return SPICE_MOUSE_BUTTON_MASK.RIGHT;
      default:
        return null;
    }
  }