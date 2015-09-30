var log = logging.handle("manageCheckin");

var selectedRegistrationReact = new ReactiveVar(null);
Template.manageCheckin.created = function() {
  var template = this;
  selectedRegistrationReact.set(null);
};

Template.manageCheckin.rendered = function() {
  var template = this;

  template.autorun(function() {
    var data = Template.currentData();

    React.render(
      <CheckinList competitionId={data.competitionId} />,
      template.$(".reactRenderArea")[0]
    );
  });
};

Template.manageCheckin.destroyed = function() {
  var template = this;
  selectedRegistrationReact.set(null);
  var unmounted = React.unmountComponentAtNode(
    template.$(".reactRenderArea")[0]
  );
  assert(unmounted);
};

Template.manageCheckin.helpers({
  selectedRegistration: function() {
    return selectedRegistrationReact.get();
  },
});

Template.manageCheckin.events({
  'click .addParticipant': function() {
    var newRegistration = {
      competitionId: this.competitionId,
    };
    selectedRegistrationReact.set(newRegistration);
    $("#modalEditRegistration").modal('show');
  },
  'click .js-delete-registration': function() {
    var that = this;
    var confirmStr = "Are you sure you want to delete the registration for " + this.uniqueName + "?";
    bootbox.confirm(confirmStr, function(confirm) {
      if(confirm) {
        Registrations.remove(that._id);
        $("#modalEditRegistration").modal('hide');
      }
    });
  },
  'hidden.bs.modal .modal': function(e, template) {
    selectedRegistrationReact.set(null);
    AutoForm.resetForm('editRegistrationForm');
  },
});

Template.modalEditRegistration.helpers({
  editRegistrationFormType: function() {
    return this._id ? "update" : "insert";
  },
});

AutoForm.addHooks('editRegistrationForm', {
  onSuccess: function(operation, result, template) {
    $("#modalEditRegistration").modal('hide');
  },
});

var CheckinList = React.createClass({
  mixins: [ReactMeteorData],

  getMeteorData: function() {
    var competitionId = this.props.competitionId;
    var registrations = Registrations.find({ competitionId: competitionId }, { sort: { uniqueName: 1 } });

    var competitionEvents = getCompetitionEvents(this.props.competitionId);

    return {
      registrations: registrations,
      competitionEvents,
    };
  },
  componentWillMount: function() {
    log.l1("component will mount");
  },
  componentDidMount: function() {
    log.l1("component did mount");

    var $checkinTable = $(this.refs.checkinTable.getDOMNode());
    makeTableSticky($checkinTable);
  },
  componentWillUpdate(nextProps, nextState) {
    log.l1("component will update");
  },
  componentDidUpdate(prevProps, prevState) {
    log.l1("component did update");
  },
  componentWillUnmount: function() {
    log.l1("component will unmount");

    var $checkinTable = $(this.refs.checkinTable.getDOMNode());
    makeTableNotSticky($checkinTable);
  },
  registeredCheckboxToggled: function(registration, event, e) {
    var registeredForEvent = _.contains(registration.registeredEvents, event.eventCode);
    var update;
    if(registeredForEvent) {
      // if registered, then unregister
      update = {
        $pull: {
          registeredEvents: event.eventCode
        }
      };
    } else {
      // if not registered, then register
      update = {
        $addToSet: {
          registeredEvents: event.eventCode
        }
      };
    }
    Registrations.update(registration._id, update);
  },
  checkInClicked: function(registration, e) {
    var eventsToUncheckinFor = _.difference(registration.checkedInEvents, registration.registeredEvents);
    if(eventsToUncheckinFor.length) {
      var eventsStr = eventsToUncheckinFor.join(",");
      var confirmStr = "";
      confirmStr += "You are about to uncheck-in " + registration.uniqueName +
                    " from " + eventsStr + ", which may involve deleting " +
                    " results if they have already competed. Are you sure" +
                    " you want to proceed?";
      bootbox.confirm(confirmStr, function(confirm) {
        if(confirm) {
          Meteor.call('checkInRegistration', registration._id);
        }
      });
    } else {
      // no need for a prompt, just check 'em in!
      Meteor.call('checkInRegistration', registration._id);
    }
  },
  handleEditRegistration: function(registration) {
    selectedRegistrationReact.set(registration);
    $("#modalEditRegistration").modal('show');
  },
  render: function() {
    var that = this;

    return (
      <div>
        <table id="checkinTable" className="table table-striped" ref="checkinTable">
          <thead>
            <tr>
              <th>Name</th>
              <th className="text-nowrap">WCA Id</th>
              <th>Gender</th>
              <th>Birthday</th>
              {that.data.competitionEvents.map(function(event) {
                return (
                  <th key={event.eventCode} className="text-center">
                    <span className={"cubing-icon icon-" + event.eventCode} alt={event.eventCode}></span><br />
                    <span>{event.eventCode}</span>
                  </th>
                );
              })}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {that.data.registrations.map(function(registration) {
              var needsCheckinButton = false;
              var eventTds = [];
              that.data.competitionEvents.forEach(function(event) {
                var registeredForEvent = _.contains(registration.registeredEvents, event.eventCode);
                var checkedInForEvent = _.contains(registration.checkedInEvents, event.eventCode);
                if(registeredForEvent != checkedInForEvent) {
                  needsCheckinButton = true;
                }

                var classes = classNames({
                  'text-center': true,
                  'registered-for-event': registeredForEvent,
                  'checkedin-for-event': checkedInForEvent,
                });
                var onChange = that.registeredCheckboxToggled.bind(null, registration, event);
                eventTds.push(
                  <td key={event.eventCode} className={classes} onClick={onChange}>
                    <input type="checkbox" checked={registeredForEvent} onChange={onChange} />
                  </td>
                );
              });

              var checkinButtonText = registration.checkedInEvents.length ? "Check-in" : "Check-in";
              var onClick = that.checkInClicked.bind(null, registration);
              var style = {};
              if(!needsCheckinButton) {
                // We don't want the table to shift around as these buttons appear and
                // disappear, so just set it to be invisible, but still take up space.
                style.visibility = 'hidden';
              }
              var checkinButton = (
                <button type="button"
                        className="btn btn-default btn-xs"
                        style={style}
                        onClick={onClick}>
                  {checkinButtonText}
                </button>
              );

              var handleEditRegistration = that.handleEditRegistration.bind(null, registration);
              var gender = registration.gender ? wca.genderByValue[registration.gender].label : '';
              return (
                <tr key={registration._id}>
                  <td>{registration.uniqueName}</td>
                  <td>{registration.wcaId}</td>
                  <td>{gender}</td>
                  <td className="text-nowrap">
                    {formatMomentDateIso8601(moment(registration.dob))}
                  </td>
                  {eventTds}
                  <td className="text-nowrap">
                    <button type="button"
                            name="buttonEditRegistration"
                            className="btn btn-default btn-xs"
                            onClick={handleEditRegistration}>
                      <span className="glyphicon glyphicon-wrench"></span>
                    </button>
                    {checkinButton}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
});
