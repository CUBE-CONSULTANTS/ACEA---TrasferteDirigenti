sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/ui/core/date/UI5Date",
    "sap/ui/unified/library",
    "sap/ui/model/json/JSONModel",

],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, Fragment, UI5Date, unifiedLibrary, JSONModel) {
        "use strict";
        var CalendarDayType = unifiedLibrary.CalendarDayType;

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
            //form
            createDialog: async function () {
                const view = this.getView();
                const self = this
                const oInnerFragment = await sap.ui.core.Fragment.load({
                    name: "trasfertedirigenti.view.Fragments.FormTrasferta",
                    controller: this
                });
                this._oDialog = new sap.m.Dialog({
                    customHeader: new sap.m.Bar({
                        contentLeft: [
                            new sap.m.Title({ text: "Modifica Trasferta" })
                        ],
                        contentRight: [
                            new sap.m.Button({
                                icon: "sap-icon://decline",
                                type: "Transparent",
                                press: () => {
                                    this._oDialog.close();
                                }
                            })

                        ]
                    }),
                    content: [oInnerFragment],
                    controller: this,
                    endButton: new sap.m.Button({
                        text: "Salva",
                        type: "Emphasized",
                        icon: "sap-icon://save",
                        tooltip: "Salva trasferta",
                        press: () => {
                            // self?.onSaveChange()
                            this._oDialog.close();
                        }
                    }),
                    beginButton: new sap.m.Button({
                        text: "Elimina",
                        type: "Transparent",
                        icon: "sap-icon://delete",
                        tooltip: "Cancellazione trasferta",
                        press: () => {
                            this._oDialog.close();
                        }
                    })
                });

                view.addDependent(this._oDialog);
                this._oDialog.open();
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
                catch (err) {
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
                            data_inizio: "14-12-2025",
                            data_fine: "14-12-2025",
                            ora_inizio: "09:00:00",
                            ora_fine: "18:00:00"
                        },
                        {
                            type_trasferta: "AT4",
                            tipotrasfertakey: "TrasfertaDirigenteEstero",
                            tipo_trasferta: "Trasferta Dirigente Estero",
                            data_inizio: "11-12-2025",
                            data_fine: "11-12-2025",
                            ora_inizio: "13:00:00",
                            ora_fine: "20:00:00"
                        },
                        {
                            type_trasferta: "AT2",
                            tipotrasfertakey: "TrasfertaDirigenteItalia",
                            tipo_trasferta: "Trasferta Dirigente Italia",
                            data_inizio: "04-12-2025",
                            data_fine: "08-12-2025",
                            ora_inizio: "09:00:00",
                            ora_fine: "19:00:00"
                        }
                    ]
                }), "modello")
            },
            //CALENDAR
            initCalendar: async function () {

                const oCalendar = this.byId("SPC1");
                await this.disableHoliday(oCalendar)

                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData({
                    startDate: UI5Date.getInstance(new Date()),
                    types: (function () {
                        var aTypes = [];
                        for (var key in CalendarDayType) {
                            aTypes.push({
                                type: CalendarDayType[key]
                            });
                        }
                        return aTypes;
                    })(),
                    appointments: [{
                        title: "Trasferta Dirigente Estero",
                        type: CalendarDayType.Type01,
                        startDate: UI5Date.getInstance("2025", "11", "4", "9", "0"),
                        endDate: UI5Date.getInstance("2025", "11", "8", "19", "0"),
                        text: ""
                    }, {
                        title: "Trasferta Dirigente Estero",
                        type: CalendarDayType.Type01,
                        startDate: UI5Date.getInstance("2025", "11", "11", "13", "0"),
                        endDate: UI5Date.getInstance("2025", "11", "11", "20", "0"),
                        text: ""
                    }, {
                        title: "Trasferta Dirigente Italia",
                        type: CalendarDayType.Type05,
                        startDate: UI5Date.getInstance("2025", "11", "14", "09", "0"),
                        endDate: UI5Date.getInstance("2025", "11", "14", "18", "0"),
                        text: "Nota della trasferta"
                    }
                    ],
                    legendItems: [
                        {
                            text: "Trasferta Dirigente Estero",
                            type: "Type01"
                        },
                        {
                            text: "Trasferta Dirigente Estero",
                            type: "Type05"
                        }
                    ],
                    legendAppointmentItems: [
                        {
                            text: "Trasferta Dirigente Estero",
                            type: CalendarDayType.Type01
                        },
                        {
                            text: "Trasferta Dirigente Italia",
                            type: CalendarDayType.Type05
                        },
                    ],
                });

                this.getView().setModel(oModel);
                oModel = new JSONModel();
                var oStateModel = new JSONModel();
                oStateModel.setData({
                    legendShown: false
                });
                this.getView().setModel(oStateModel, "stateModel");
                oModel.setData({ allDay: false });
                this.getView().setModel(oModel, "allDay");
            },
            _getDefaultAppointmentStartHour: function () {
                return 9;
            },

            _getDefaultAppointmentEndHour: function () {
                return 10;
            },

            _setHoursToZero: function (oDate) {
                oDate.setHours(0, 0, 0, 0);
            },

            handleAppointmentSelect: function (oEvent) {
                var oAppointment = oEvent.getParameter("appointment")
                if (!oAppointment) return
                let { endDate, startDate, text, title } = oAppointment.getBindingContext().getObject()

                this.getView().getModel("modello").setProperty("/tipotrasfertakey", title.replaceAll(" ", ""));
                this.getView().getModel("modello").setProperty("/data_inizio", this._formatStartDate(startDate));
                this.getView().getModel("modello").setProperty("/data_fine", this._formatStartDate(endDate));
                this.getView().getModel("modello").setProperty("/ora_inizio", this._formatStartHour(startDate));
                this.getView().getModel("modello").setProperty("/ora_fine", this._formatStartHour(endDate))
                this.getView().getModel("modello").setProperty("/note", text)
                this.getView().getModel("modello").setProperty("/edit", true)
                this.getView().getModel("modello").setProperty("/required", true)


                this.createDialog()
            },
        })
    })