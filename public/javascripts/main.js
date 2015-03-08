var app = {
    patientId: "54fb87bdf5380a9c437bbb5e"
};

var PatientModel = Backbone.Model.extend({
    url: function () {
        var id = this.has("_id") ? "/" + this.get("_id") : "";

        return "/api/v1/patients" + id;
    },
    parse: function (resp) {
        return {
            id: resp._id,
            _id: resp._id,
            name: resp.name,
            birthDate: moment(resp.birthDate),
            deathDate: moment(resp.deathDate)
        };
    }
});

var PatientCollection = Backbone.Collection.extend({
    url: "/api/v1/patients",
    model: PatientModel
});

var LifeEventModel = Backbone.Model.extend({
    url: function () {
        var id = this.has("_id") ? "/" + this.get("_id") : "";

        return "/api/v1/lifeevents" + id;
    }
});

var LifeEventCollection = Backbone.Collection.extend({
    url: "/api/v1/lifeevents",
    model: LifeEventModel,
    parse: function (resp) {
        return _(resp).map(function (lifeEvent) {
            return {
                id: lifeEvent._id,
                _id: lifeEvent._id,
                content: lifeEvent.content,
                startDate: moment(lifeEvent.startDate),
                endDate: moment(lifeEvent.endDate),
                tags: lifeEvent.tags || []
            };
        });
    }
});

var QueryModel = Backbone.Model.extend({
});

var SearchView = Backbone.View.extend({
    initialize: function () {
        this.model = new QueryModel();
        this.addBinding(null, "#query", "query");
        this.addBinding(null, "#patient", "patient");

        this.$el.on("submit", function (e) {
            e.preventDefault();
        });
    },

    render: function () {
        this.stickit();
    }
});

var LifeEventFormView = Backbone.View.extend({
    el: "#tl-lifeevent-form",

    initialize: function () {
        var self = this;

        this.$el.find("form").on("submit", function (e) {
            e.preventDefault();

            var $form = $(this);
            var startDate = $(this).find("[data-date]").val();
            var content = $(this).find("[data-content]").val();
            var tag = $(this).find("[data-tag]").val();

            var lifeEvent = new LifeEventModel({
                startDate: moment(startDate).format(),
                content: content,
                tags: [tag],
                patient_id: app.patientId
            });

            lifeEvent
                .save()
                .then(function () {
                    $form[0].reset();
                    changePatient(app.patientId);
                });

            $(".main-scroll").animate({
                scrollTop: 0
            }, 0);
            self.hide();
        });

        this.hide();
    },

    show: function () {
        this.$el.show();
    },

    hide: function () {
        this.$el.hide();
    }
});

$(function () {
    initSearchView();

    app.lifeEventFormView = new LifeEventFormView();

    initLifeEventAdder();

    changePatient(app.patientId);
});

function changePatient(patientId) {
    app.patientId = patientId;

    // load patient data and their lifeEvents
    var patientModel = new PatientModel({
        _id: patientId
    });
    var lifeEventCollection = new LifeEventCollection();

    async.parallel({
        "patient": function (done) {
            patientModel
                .fetch()
                .then(function (patient) {
                    done(null, patientModel.toJSON());
                });
        },

        "lifeEvents": function (done) {
            lifeEventCollection
                .fetch({
                    data: {
                        query: JSON.stringify({
                            patient_id: patientId
                        })
                    }
                })
                .then(function () {
                    var data = _(lifeEventCollection.toJSON())
                        .sortBy(function (lifeEvent) {
                            return Number.MAX_SAFE_INTEGER - lifeEvent.startDate;
                        });

                    done(null, data);
                });
        }
    }, function (err, data) {
        var patient = data.patient;
        var lifeEvents = app.lifeEvents = data.lifeEvents;

        console.log(patient, lifeEvents);

        var timeline, html;

        // render future
        template = _.template($("#template-future").html());
        html = template({
            moment: moment,
            patient: patient,
            futureEvents: [
                {
                    date: new Date(2055, 2, 20),
                    card: "card-3",
                    todos: [
                        "昔の恋人に謝りに行く。",
                        "車を売る。"
                    ]
                },
                {
                    date: new Date(2055, 2, 1),
                    card: "card",
                    todos: [
                        "寿司屋「すし岩」へ食べに行く。",
                        "昔の恋人に謝りに行く。"
                    ]
                }
            ]
        });

        $("#future").html(html);

        // render timeline
        template = _.template($("#template-timeline").html());
        html = template({
            moment: moment,
            lifeEvents: lifeEvents
        });

        $("#timeline").html(html);

        // Create a DataSet (allows two way data-binding)
        //var items = app.items = new vis.DataSet(lifeEvents);

        // Configuration for the Timeline
        //var minDate = moment(patient.birthDate);
        //var maxDate = moment(patient.deathDate);

        //minDate.add(-3, "months");
        //maxDate.add(3, "months");

        //var options = {
        //    min: minDate,
        //    max: maxDate,
        //    editable: true,
        //    zoomable: false
        //};

        //// Create a Timeline
        //var timeline = app.timeline = new vis.Timeline(
        //    container,
        //    items,
        //    options
        //);
    });
};

function initSearchView() {
    // init search view
    var searchView = new SearchView({
        el: "#search"
    });

    searchView.model.on("change:patient", _.debounce(function (model) {
        var patient = model.get("patient");

        changePatient(patient);
    }, 1000));

    searchView.model.on("change:query", function (model) {
        var query = model.get("query");
        var filteredLifeEvents = filterByQuery(app.lifeEvents, query);

        //app.items.clear();
        //app.items.add(filteredLifeEvents);

        //app.timeline.fit();
    });
}

function filterByQuery(lifeEvents, query) {
    if (!query) {
        return lifeEvents;
    }

    return lifeEvents.filter(function (lifeEvent) {
        return !!~lifeEvent.tags.indexOf(query);
    });
}

function initLifeEventAdder() {
    $(document).on("click", "[data-add-lifeevent]", function () {
        app.lifeEventFormView.show();
    });
}
