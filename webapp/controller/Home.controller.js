sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/core/format/DateFormat',
    'sap/ui/core/date/UI5Date',
    "./BaseController"
], (Controller, DateFormat, UI5Date, BaseController) => {
    "use strict";

    return BaseController.extend("trasfertedirigenti.controller.Home", {
        onInit() {
            this.getOwnerComponent()
                .getRouter()
                .getRoute("RouteHome")
                .attachPatternMatched(this._onRouteMatched, this);
        },
        _onRouteMatched: function (oEvent) {
            this.initModel()
            this.createModel({ edit: true, required: true })
        },
        initModel: async function () {
            let day = await this.holidays()
            var oModel = new sap.ui.model.json.JSONModel();
            let date_disable = day.map(x => {
                return { start: UI5Date.getInstance(x.year, x.month - 1, x.day) }
            })
            oModel.setData({
                disabled: date_disable
            });
            this.getView().setModel(oModel);
            this.loadFragment("NuovaTrasferta") //change fragment
        },


        onChangeDateCalendar: async function (oEvent) {
            let year = oEvent.getSource().getStartDate().getFullYear()
            const day = await this.holidays(year)
            var oModel = new sap.ui.model.json.JSONModel();
            let date_disable = day.map(x => {
                return { start: UI5Date.getInstance(x.year, x.month - 1, x.day) }
            })
            oModel.setData({
                disabled: date_disable
            });
            this.getView().setModel(oModel);
        },
        handleCalendarSelect: function (oEvent) {
            const data_selected = oEvent.getSource().getSelectedDates()[0].getProperty("startDate");
            const oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "dd-MM-yyyy" });

            const data_formattata = oDateFormat.format(data_selected);
            const { data_inizio, data_fine } = this.getView().getModel("modello").getData()

            if (data_inizio && data_fine) {
                this.getView().getModel("modello").setProperty("/data_fine", null);
                return this.getView().getModel("modello").setProperty("/data_inizio", data_formattata);
            } else
                if (data_inizio) {
                    return this.getView().getModel("modello").setProperty("/data_fine", data_formattata);
                } else
                    if (data_fine) {
                        return this.getView().getModel("modello").setProperty("/data_inizio", data_formattata);
                    } else {
                        return this.getView().getModel("modello").setProperty("/data_inizio", data_formattata);

                    }
        },
        onChangeFragment: function (oEvent) {
            const fragment_selected = oEvent.getSource().getSelectedKey()
            this.loadFragment(fragment_selected)
            if (fragment_selected == 'NuovaTrasferta') this.createModel({ edit: true, required: true })
            else this.createModel({ edit: false, required: false })

        },
        onSetEdit: function (oEvent) {
            const index_selected = oEvent.getSource().getSelectedIndex()
            if (index_selected >= 0) {
                const obj_selected = oEvent.getSource().getRows()[index_selected].getBindingContext("modello").getObject()
                this.createModel({ ...obj_selected, edit: false, required: false })
            } else {
                this.createModel({ edit: false, required: false })
            }
        },
        onChange: function (oEvent) {
            const table = oEvent.getSource()?.getParent()?.getParent()
            let itemSelected = table?.getSelectedIndex()
            if (itemSelected >= 0) {
                const obj_selected = table.getRows()[itemSelected].getBindingContext("modello").getObject()
                this.createModel({ ...obj_selected, edit: true, required: true })
            }
        },
        ///Prova
        onNavOther: function () {
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("Other");
        }
    });
});