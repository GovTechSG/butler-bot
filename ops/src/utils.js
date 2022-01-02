const sortCalendar = (a = '', b = '') => {
    const aLocation = a.location.toUpperCase(); // ignore upper and lowercase
    const bLocation = b.location.toUpperCase(); // ignore upper and lowercase

    if (aLocation === bLocation) {
        const aCapacity = a.capacity ? parseInt(a.capacity) : 0;
        const bCapacity = b.capacity ? parseInt(b.capacity) : 0;
        return (aCapacity < bCapacity) ? -1 : 1;
    }
    return aLocation < bLocation ? -1 : 1;
};

module.exports = { sortCalendar };
