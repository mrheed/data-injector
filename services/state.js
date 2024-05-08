export const globalState = {
  set: (property, value) => {
    const updateProperty = (obj, props, value) => {
      const prop = props.shift();
      if (!prop) return;
      if (!obj[prop]) {
        Object.assign(obj, { [prop]: {} });
      }
      if (props.length === 0) {
        Object.assign(obj, { [prop]: value });
      } else {
        updateProperty(obj[prop], props, value);
      }
    };

    const props = property.split('.');
    updateProperty(globalState, props, value);
  },
  get: (property) => {
    const properties = property.split('.');
    let state = globalState;
    for (const prop of properties) {
      state = state[prop];
    }

    return state;
  }
}