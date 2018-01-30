export function capitalize(str: string) {
    return str.replace(/^[a-z]/i, (c) => c.toUpperCase());
}

export function camelCaseToDashCase(str: string) {
    return str.replace(/([a-zA-Z])(?=[A-Z])/g, "$1-").toLowerCase();
}

export function dashCaseToCamelCase(str: string) {
    return str.replace(/-([a-z])/gi, (g) => g[1].toUpperCase());
}

export function dashCaseToCamelCaseUpper(str: string) {
    return capitalize(
        dashCaseToCamelCase(str));
}
