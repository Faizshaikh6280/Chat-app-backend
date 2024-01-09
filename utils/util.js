function filterObj(obj, ...allowedProperties) {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (allowedProperties.includes(key)) {
      newObj[key] = obj[key];
    }
  });
  return newObj;
}

module.exports = filterObj;
