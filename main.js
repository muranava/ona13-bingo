(function( window ) {
'use strict';

// Variation of Paul Irish's log() for my IIFE setup:
// http://paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
function log() {
  log.history = log.history || [];
  log.history.push( arguments );
  if ( window.console ) {
    window.console.log( Array.prototype.slice.call( arguments ) );
  }
}

// Library variables
var $ = window.jQuery,
  _ = window._,
  Backbone = window.Backbone;

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=- CONFIGURATION =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

_.templateSettings.variable = 'context';

var config = {
  cardsTall: 5,
  cardsWide: 5
};

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-= BINGO SPACES =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var BingoSpace,
  BingoSpaceView;

BingoSpace = Backbone.Model.extend({
  defaults: {
    checked: false
  }
});

BingoSpaceView = Backbone.View.extend({
  tagName: 'li',
  className: 'bingo-space',
  events: {
    'click': 'toggleChecked'
  },
  initialize: function() {
    _.bindAll( this, 'render', 'template', 'toggleChecked' );

    this.model.on( 'change', this.render );
    this.model.on( 'change:checked', function( bingoSpace ) {
      if ( bingoSpace.get( 'checked' ) ) {
        this.$el.addClass( 'bingo-space-checked' );
      } else {
        this.$el.removeClass( 'bingo-space-checked' );
      }
    }, this );
  },
  template: _.template( $( '#bingo-space-template' ).html() ),
  render: function() {
    this.$el.html( this.template({
      bingoSpace: this.model,
      config: config
    }) );
    return this;
  },
  toggleChecked: function() {
    this.model.set( 'checked', !this.model.get( 'checked' ) );
  }
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-= BINGO CARDS -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var BingoCard,
  BingoCardView;

BingoCard = Backbone.Collection.extend({
  model: BingoSpace,
  localStorage: new Backbone.LocalStorage( 'BingoCard' )
});

BingoCardView = Backbone.View.extend({
  tagName: 'ol',
  className: 'bingo-card',
  initialize: function() {
    _.bindAll( this, 'render' );

    this.bingoSpaceViews = {};
  },
  render: function() {
    this.collection.each(function( bingoSpace ) {
      var bingoSpaceView,
        bingoSpaceId;

      bingoSpaceId = bingoSpace.get( 'id' );
      bingoSpaceView = this.bingoSpaceViews[ bingoSpaceId ];

      if ( bingoSpaceView ) {
        // He's already got one, you see!
        return;
      }

      bingoSpaceView = new BingoSpaceView({
        model: bingoSpace
      });
      this.$el.append( bingoSpaceView.render().$el );

      this.bingoSpaceViews[ bingoSpaceId ] = bingoSpaceView;
    }, this );

    return this;
  }
});

// -=-=-=-=-=-=-=-=-=-=-=-=-= DEBUGGING VARIABLES -=-=-=-=-=-=-=-=-=-=-=-=-=-=-

window.BingoSpace = BingoSpace;
window.BingoSpaceView = BingoSpaceView;
window.BingoCard = BingoCard;
window.BingoCardView = BingoCardView;

}( this ));
