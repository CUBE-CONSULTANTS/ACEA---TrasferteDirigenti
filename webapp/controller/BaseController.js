sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/ui/core/date/UI5Date",
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, Fragment, UI5Date) {
        "use strict";
        return Controller.extend("trasfertedirigenti.controller.BaseController", {
            loadFragment: async function (fragmentName) {
                const fragment = await Fragment.load({
                    id: fragmentName,
                    name: `trasfertedirigenti.view.Fragments.${fragmentName}`,
                    controller: this
                })
                if (this.getView().getContent()[0].getContent()) {
                    this.getView().getContent()[0].getContent().destroy()
                }
                this.getView().getContent()[0].setContent(fragment)
            },
            _formatDate: function (sDate, sTime) {
                const [day, month, year] = sDate.split("/").map(Number);
                const [hour, minute] = sTime.split(":").map(Number);

                return UI5Date.getInstance(year, month - 1, day, hour, minute, 0, 0);
            },
            _formatStartDate: function (date) {
                return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
            },
            _formatStartHour: function (date) {
                return `${date.getHours()}:${date.getMinutes()}`
            },
            disableHoliday: async function (oCalendar, year = "2025") {
                let days = await this.holidays(year)
                days.forEach(x => {
                    oCalendar.addSpecialDate(
                        new sap.ui.unified.DateTypeRange({
                            type: "NonWorking",
                            startDate: UI5Date.getInstance(x.year, x.month - 1, x.day),
                            endDate: UI5Date.getInstance(x.year, x.month - 1, x.day)
                        })
                    );
                });
            },
            holidays: async function (year = "2025") {
                const api = "B34olFqRKklQ069YrjZ8NOesv9iz4tWO";
                try {
                    return await fetch(`https://calendarific.com/api/v2/holidays?api_key=${api}&country=IT&year=${year}`)
                        .then(response => response.json())
                        .then(data =>
                            data.response.holidays.map(x => x.date).map(x => x.datetime)
                        )
                     
                }
                catch(err){
                    return []
                }

            },
            createModel: function ({ tipo_trasferta = null, tipotrasfertakey = null, data_inizio = null, data_fine = null, ora_inizio = null,
                ora_fine = null, modify = null,
                note = null, edit, required }) {
                this.getView().setModel(new sap.ui.model.json.JSONModel({
                    tipo_trasferta,
                    tipotrasfertakey,
                    data_inizio,
                    data_fine,
                    ora_inizio,
                    ora_fine,
                    note,
                    required,
                    edit,
                    modify, //per salvare il path dell'elemento modificato per il calendar
                    table: [
                        {
                            type_trasferta: "AT4",
                            tipotrasfertakey: "TrasfertaDirigenteEstero",
                            tipo_trasferta: "Trasferta Dirigente Estero",
                            data_inizio: "14-11-2025",
                            data_fine: "14-11-2025",
                            ora_inizio: "09:00:00",
                            ora_fine: "18:00:00"
                        },
                        {
                            type_trasferta: "AT4",
                            tipotrasfertakey: "TrasfertaDirigenteEstero",
                            tipo_trasferta: "Trasferta Dirigente Estero",
                            data_inizio: "11-12-2023",
                            data_fine: "11-12-2023",
                            ora_inizio: "13:00:00",
                            ora_fine: "20:00:00"
                        },
                        {
                            type_trasferta: "AT2",
                            tipotrasfertakey: "TrasfertaDirigenteItalia",
                            tipo_trasferta: "Trasferta Dirigente Italia",
                            data_inizio: "04-09-2023",
                            data_fine: "04-09-2023",
                            ora_inizio: "09:00:00",
                            ora_fine: "19:00:00"
                        }
                    ]
                }), "modello")
            }
        })
    })