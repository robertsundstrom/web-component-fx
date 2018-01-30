export function convertValue(toType: any, val: any) {
    const propType = toType;
    if (propType === Number) {
        let convertedValue = parseFloat(val);
        if (isNaN(val)) {
            convertedValue = parseInt(val, 10);
        }
        val = convertedValue;
        if (isNaN(val)) {
            throw new Error("Expected number value");
        }
    } else if (propType === Boolean) {
        if (!val) {
            val = true;
        } else {
            if (val === "true" || val === "false") {
                val = val === "true";
            } else {
                throw new Error("Expected boolean value");
            }
        }
    }
    return val;
}
