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
  Backbone = window.Backbone,
  Firebase = window.Firebase;

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=- CONFIGURATION =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var config = {
  cardsTall: 5,
  cardsWide: 5,
  firebaseUrl: 'https://ona13-bingo.firebaseio.com'
};

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-= BINGO SPACES =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var BingoSpace,
  BingoSpaceView;

BingoSpace = Backbone.Model.extend({});

BingoSpaceView = Backbone.View.extend({
  tagName: 'li',
  className: 'bingo-space',
  initialize: function() {
    _.bindAll( this, 'render', 'template' );

    this.on( 'change', this.render );
  },
  template: _.template( $( '#bingo-space-template' ).html() ),
  render: function() {
    this.$el.html( this.template({
      config: config
    }) );
    return this;
  }
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-= BINGO CARDS -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var BingoCard,
  BingoCardView;

BingoCard = Backbone.Firebase.Collection.extend({
  model: BingoSpace,
  firebase: config.firebaseUrl
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

}( this ));