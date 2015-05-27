(function () {
  if (typeof Main === "undefined") {
    window.Main = {};
  }

  var App = Main.App = function ($el) {
    this.$el = $el;
    this.views = [];
  };

  var View = Main.View = function (options) {
    _.extend(this, options);

    // get cached $el object
    this.$el = $(options.el);

    // allows for multiple templates to be associated with one view
    this.template = _.map( $(options.template), function (template) {
      return _.template( $(template).html() );
    } );
  };

  View.prototype.render = function (options) {
    // TODO: Make this work for tablet,
    // this renders all templates at once
    // this.$el.html( _.map(this.templates, function (template) { return template() }));
    var index = options.active && options.active < this.template.length ? options.active : 0;

    this.$el.html( this.template[ index ]() );

    this.bindEvents();
  };

  View.prototype.toggleEvents = function (bind) {
    var self = this;
    _.each( this.events, function (handler, listenerString) {
      var event = listenerString.split( ' ' )[0]
        , target = listenerString.split( ' ' )[1];

      var $target = self.$el.find(target);

      bind ? $target.on( event, handler.bind( self ) ) : $target.off( event, handler.bind( self ) );
    } );
  };

  View.prototype.bindEvents = function () {
    this.toggleEvents.call(this, true);
  }

  View.prototype.unbindEvents = function () {
    this.toggleEvents.call(this, false);
  }

  // Allow the views to inherit from the parent View class
  var Surrogate = function () {};
  Surrogate.prototype = View.prototype;

  var FormView = Main.FormView = function (options) {
    View.call( this, _.extend( {}, options, {
      el: '.form',
      template: '.form-template'
    } ) );
  }

  FormView.prototype = new Surrogate();

  var PreviewView = Main.PreviewView = function (options) {
    View.call( this, _.extend( {}, options, {
      el: '.preview',
      template: '.preview-template'
    } ) );
  }

  PreviewView.prototype = new Surrogate();

  var NavigationView = Main.NavigationView = function (options) {
    View.call( this, _.extend( {}, options, {
      el: '.navigation',
      template: '.navigation-template',
      events: {
        'click button.next': function () { this.emitter.trigger('emitter:next') },
        'click button.prev': function () { this.emitter.trigger('emitter:prev') }
      }
    } ) );
  };

  NavigationView.prototype = new Surrogate();


  App.prototype.initialize = function () {
    // TODO: Use local storage to set and get the active template
    // for the form view
    this.views.push(
      new FormView(),
      new PreviewView(),
      new NavigationView({ emitter: this.$el })
    );

    // set the initial state of the application
    this.setState( this.getInitialState() );

    // set up emitter bindings
    this.$el.on( 'emitter:next', this.next.bind(this) );
    this.$el.on( 'emitter:prev', this.prev.bind(this) );

    return this;
  };

  App.prototype.getInitialState = function () {
    // TODO: use local storage here
    return {
      active: 0
    }
  };

  App.prototype.setState = function (state) {
    // set or create the new state
    this.state = _.extend({}, this.state, state);

    // render the views
    this.render();
  };

  App.prototype.next = function () {
    this.setState({ active: this.state.active + 1 });
  };

  App.prototype.prev = function () {
    this.setState({ active: this.state.active - 1 });
  }

  App.prototype.render = function () {
    var self = this;

    _.each(this.views, function (view) {
      view.render({ active: self.state.active });
    });

    return this;
  };
})();

$(function() {
  if (window.Main !== "undefined") {
    var app = new Main.App($('.container'));

    // TODO: remove from production. The app instance is set on window
    // for debugging
    window.app = app;

    app.initialize().render();

  };
})