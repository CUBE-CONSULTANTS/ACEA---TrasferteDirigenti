sap.ui.define([
    "sap/ui/core/library",
    "sap/ui/core/Fragment",
    "sap/ui/core/format/DateFormat",
    "sap/ui/model/json/JSONModel",
    "sap/ui/unified/library",
    "sap/ui/core/date/UI5Date",
    "./BaseController",
    "sap/m/MessageBox",
    "../model/formatter"
],
    function (coreLibrary, Fragment, DateFormat, JSONModel, unifiedLibrary, UI5Date, BaseController, MessageBox, formatter) {
        "use strict";

        var CalendarDayType = unifiedLibrary.CalendarDayType;

        return BaseController.extend("trasfertedirigenti.controller.Other", {
            formatter: formatter,

            onInit: async function () {
                this.createModel({ edit: true, required: true })
                //set holiday 
                const oCalendar = this.byId("SPC1");
                await this.disableHoliday(oCalendar)

                var oModel = new JSONModel();
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
                        startDate: UI5Date.getInstance("2025", "10", "8", "5", "0"),
                        endDate: UI5Date.getInstance("2025", "10", "8", "6", "0"),
                        text: ""
                    }, {
                        title: "Trasferta Dirigente Estero",
                        type: CalendarDayType.Type01,
                        startDate: UI5Date.getInstance("2025", "10", "9", "7", "0"),
                        endDate: UI5Date.getInstance("2025", "10", "9", "8", "0"),
                        text: ""
                    }, {
                        title: "Trasferta Dirigente Italia",
                        type: CalendarDayType.Type05,
                        startDate: UI5Date.getInstance("2025", "10", "10", "10", "0"),
                        endDate: UI5Date.getInstance("2025", "10", "11", "19", "0"),
                        text: ""
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

            handleAppointmentSelect: function (oEvent) {
                var oAppointment = oEvent.getParameter("appointment"),
                    oStartDate,
                    oEndDate,
                    oTrimmedStartDate,
                    oTrimmedEndDate,
                    bAllDate,
                    oModel,
                    oView = this.getView();

                if ((!oAppointment || !oAppointment.getSelected()) && this._pDetailsPopover) {
                    this._pDetailsPopover.then(function (oResponsivePopover) {
                        oResponsivePopover.close();
                    });
                    return;
                }

                oStartDate = oAppointment.getStartDate();
                oEndDate = oAppointment.getEndDate();
                oTrimmedStartDate = UI5Date.getInstance(oStartDate);
                oTrimmedEndDate = UI5Date.getInstance(oEndDate);
                bAllDate = false;
                oModel = this.getView().getModel("allDay");

                this._setHoursToZero(oTrimmedStartDate);
                this._setHoursToZero(oTrimmedEndDate);

                if (oStartDate.getTime() === oTrimmedStartDate.getTime() && oEndDate.getTime() === oTrimmedEndDate.getTime()) {
                    bAllDate = true;
                }

                oModel.getData().allDay = bAllDate;
                oModel.updateBindings();

                if (!this._pDetailsPopover) {
                    this._pDetailsPopover = Fragment.load({
                        id: oView.getId(),
                        name: "trasfertedirigenti.view.Fragments.Other.Details",
                        controller: this
                    }).then(function (oDetailsPopover) {
                        oView.addDependent(oDetailsPopover);
                        return oDetailsPopover;
                    });
                }
                this._pDetailsPopover.then(function (oDetailsPopover) {
                    oDetailsPopover.setBindingContext(oAppointment.getBindingContext());
                    oDetailsPopover.openBy(oAppointment);
                });
            },

            handleEditButton: function () {
                //edit trasferta
                var oDetailsPopover = this.byId("detailsPopover");
                oDetailsPopover.close();
                const sPath = oDetailsPopover.getBindingContext().getPath();
                let appoiment_selected = this.getView().getModel().getProperty(sPath)
                this.createModel({
                    data_inizio: this._formatStartDate(appoiment_selected.startDate),
                    data_fine: this._formatStartDate(appoiment_selected.endDate),
                    ora_inizio: this._formatStartHour(appoiment_selected.startDate),
                    ora_fine: this._formatStartHour(appoiment_selected.endDate),
                    note: appoiment_selected.text,
                    tipotrasfertakey: appoiment_selected.title.replaceAll(" ", ""),
                    modify: sPath,
                    edit: true, required: true
                })
                this._arrangeDialogFragment("Edit appointment");
            },

            handlePopoverDeleteButton: function () {
                var oModel = this.getView().getModel(),
                    oDetailsPopover = this.byId("detailsPopover")
                MessageBox.confirm("Sei sicuro di voler cancellare?", {
                    actions: [MessageBox.Action.YES, MessageBox.Action.CLOSE],
                    emphasizedAction: "Manage Products",
                    onClose: function (sAction) {
                        if (sAction == 'YES') {

                            var oAppointments = oModel.getData().appointments,
                                oAppointment = oDetailsPopover._getBindingContext().getObject();

                            oDetailsPopover.close();

                            oAppointments.splice(oAppointments.indexOf(oAppointment), 1);
                            oModel.updateBindings();
                        }
                    },
                    dependentOn: this.getView()
                });
            },

            _arrangeDialogFragment: function (sTitle) {
                //open dialog for create new Management business trip
                var oView = this.getView();
                if (!this._pNewAppointmentDialog) {
                    this._pNewAppointmentDialog = Fragment.load({
                        id: "p",
                        name: "trasfertedirigenti.view.Fragments.Other.CreateAppoiment",
                        controller: this
                    }).then(function (oModifyDialog) {
                        oView.addDependent(oModifyDialog);
                        return oModifyDialog;
                    });
                }

                this._pNewAppointmentDialog.then(function (oModifyDialog) {
                    this._arrangeDialog(sTitle, oModifyDialog);
                }.bind(this));
            },
            _arrangeDialog: function (sTitle, oModifyDialog) {
                oModifyDialog.setTitle("Crea Trasferta");
                oModifyDialog.open();
            },

            handleDialogOkButton: function (oEvent) {
                debugger
                let inputValue = this.getView().getModel("modello").getData()
                let obj = {
                    title: inputValue.tipotrasfertakey.split(/(?=[A-Z])/).join(" "),
                    type: inputValue.tipotrasfertakey == 'TrasfertaDirigenteEstero' ? CalendarDayType.Type01 : CalendarDayType.Type05,
                    startDate: UI5Date.getInstance(this._formatDate(inputValue.data_inizio, inputValue.ora_inizio)),
                    endDate: UI5Date.getInstance(this._formatDate(inputValue.data_fine, inputValue.ora_fine)),
                    text: inputValue.note
                }
                if (inputValue.modify) {
                    this.getView().getModel().setProperty(inputValue.modify, obj)
                } else {
                    this.getView().getModel().getData().appointments.push(obj);
                }
                this.getView().getModel().updateBindings();
                this.createModel({ edit: true, required: true })
                oEvent?.getSource()?.getParent()?.close()
            },

            formatDate: function (oDate) {
                if (oDate) {
                    var iHours = oDate.getHours(),
                        iMinutes = oDate.getMinutes(),
                        iSeconds = oDate.getSeconds();

                    if (iHours !== 0 || iMinutes !== 0 || iSeconds !== 0) {
                        return DateFormat.getDateTimeInstance({ style: "medium" }).format(oDate);
                    } else {
                        return DateFormat.getDateInstance({ style: "medium" }).format(oDate);
                    }
                }
                return "";
            },

            handleDialogCancelButton: function (oEvent) {
                //close dialog
                oEvent.getSource().getParent().close()
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

            handleAppointmentCreate: function () {
                this._createInitialDialogValues();
            },

            handleHeaderDateSelect: function (oEvent) {
                this._createInitialDialogValues(oEvent.getParameter("date"));
            },

            _createInitialDialogValues: function (startDate = null, endDate = null) {
                let data_inizio = null, data_fine = null, ora_inizio = null, ora_fine = null
                if (startDate != null) {
                    var oStartDate = UI5Date.getInstance(startDate),
                        oEndDate = UI5Date.getInstance(endDate);
                    data_inizio = this._formatStartDate(oStartDate)
                    data_fine = this._formatStartDate(oStartDate)

                    if (oStartDate.getHours() != 0) {
                        data_fine = this._formatStartDate(oEndDate)
                        ora_inizio = this._formatStartHour(oStartDate)
                        ora_fine = this._formatStartHour(oEndDate)
                    }
                }

                this._arrangeDialogFragment("Create appointment");
                //Set model data
                this.createModel({
                    data_inizio,
                    data_fine,
                    ora_inizio,
                    ora_fine,
                    edit: true, required: true
                })

            },

            handleStartDateChange: async function (oEvent) {
                //disabilita giorni festivi
                var oStartDate = oEvent.getParameter("date");
                if (oStartDate.getFullYear() != 2025) {
                    const oCalendar = this.byId("SPC1");
                    await this.disableHoliday(oCalendar, oStartDate.getFullYear().toString())
                }
            },
            onCellPress: function (oEvent) {
                let startday_selected = oEvent.getParameter("startDate"),
                    endDate_selected = oEvent.getParameter("endDate")

                ///Bloccare il press dei giorni festivi
                const aSpecialDates = oEvent.getSource().getSpecialDates();

                let bNonWorking = false;

                aSpecialDates.forEach(oRange => {
                    if (oRange.getType() === "NonWorking") {
                        const sStart = oRange.getStartDate()?.toISOString().split("T")[0];
                        const sPressed = startday_selected?.toISOString().split("T")[0];
                        if (sStart === sPressed) {
                            bNonWorking = true;
                        }
                    }
                });

                if (bNonWorking) {
                    oEvent.preventDefault?.();
                    oEvent.cancelBubble = true;
                    return;
                }
                this._createInitialDialogValues(startday_selected, endDate_selected)

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
            //change Fragment, lista Trasferte dirigenti richieste
            onChangeFragment: function (oEvent) {
                const fragment_selected = oEvent.getSource().getSelectedKey()
                this.loadFragment(`Other.${fragment_selected}`)
                if (fragment_selected == 'SinglePlanningCalendar') this.createModel({ edit: true, required: true })
                else this.createModel({ edit: false, required: false })
            },
            onSetEdit: function (oEvent) {
                const index_selected = oEvent.getSource().getSelectedItems().length
                if (index_selected >= 0) {
                    const obj_selected = oEvent.getSource().getSelectedItem().getBindingContext().getObject()
                    const viewObj = {
                        tipotrasfertakey: obj_selected.title.replaceAll(" ", ""),
                        data_inizio: this._formatStartDate(obj_selected.startDate),
                        data_fine: this._formatStartDate(obj_selected.endDate),
                        ora_inizio: this._formatStartHour(obj_selected.startDate),
                        ora_fine: this._formatStartHour(obj_selected.endDate),
                        note: obj_selected.text,
                        required: false,
                        edit: false,
                    }
                    this.createModel(viewObj)
                } else {
                    this.createModel({ edit: false, required: false })
                }
            },
            onChange: function (oEvent) {
                const oTable = oEvent.getSource().getParent().getParent(),
                    index_selected = oTable.getSelectedItems().length
                if (index_selected >= 0) {
                    const obj_selected = oTable.getSelectedItem().getBindingContext().getObject()
                    const { sPath } = oTable.getSelectedItem().getBindingContext()
                    const viewObj = {
                        tipotrasfertakey: obj_selected.title.replaceAll(" ", ""),
                        data_inizio: this._formatStartDate(obj_selected.startDate),
                        data_fine: this._formatStartDate(obj_selected.endDate),
                        ora_inizio: this._formatStartHour(obj_selected.startDate),
                        ora_fine: this._formatStartHour(obj_selected.endDate),
                        note: obj_selected.text,
                        required: true,
                        edit: true,
                        modify: sPath
                    }
                    this.createModel(viewObj)
                } else {
                    this.createModel({ edit: false, required: false })
                }
            },
            onSaveChange: function (oEvent) {
                this.handleDialogOkButton()
                this.createModel({ edit: false, required: false })

            },
            onDelete: function (oEvent) {
                const oTable = oEvent.getSource().getParent().getParent(),
                    oModel = this.getView().getModel()
                const elementSelected = oTable.getSelectedItem().getBindingContext()
                let { sPath } = elementSelected
                MessageBox.confirm("Sei sicuro di voler cancellare?", {
                    actions: [MessageBox.Action.YES, MessageBox.Action.CLOSE],
                    emphasizedAction: "Manage Products",
                    onClose: function (sAction) {
                        if (sAction == 'YES') {
                            const indexDelete = parseInt(sPath.split("/").pop(), 10);
                            var oAppointments = oModel.getData().appointments
                            oAppointments.splice(indexDelete, 1);
                            oModel.updateBindings();
                        }
                    },
                    dependentOn: this.getView()
                });
            }

        });
    });
