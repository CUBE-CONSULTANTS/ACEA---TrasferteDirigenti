sap.ui.define([], function () {
    "use strict";

    return {
        formatDate: function (date) {
            if (!date) return "";
            const oFormat = sap.ui.core.format.DateFormat.getDateInstance({
                pattern: "dd/MM/yyyy"
            });
            return oFormat.format(date);
        },
        formatTime: function (date) {
            if (!date) return "";
            const oFormat = sap.ui.core.format.DateFormat.getDateInstance({
                pattern: "HH:mm:ss"
            });
            return oFormat.format(date);
        }
    };
});
