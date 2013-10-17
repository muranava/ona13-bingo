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
  appCoreSelector: '#bingo-app',
  cardOptions: [
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
    'g',
    'h',
    'i',
    'j',
    'k',
    'l',
    'm',
    'n',
    'o',
    'p',
    'q',
    'r',
    's',
    't',
    'u',
    'v',
    'w',
    'x',
    'y',
    'z',
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9'
  ],
  cardsTall: 5,
  cardsWide: 5
};

// -=-=-=-=-=-=-=-=-=-=-=-=-=- UTILITY FUNCTIONS =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

// Fisher-Yates array shuffle, from Mike Bostock:
// http://bost.ocks.org/mike/shuffle/
function shuffle( array ) {
  var m = array.length,
    t,
    i;

  // While there remain elements to shuffle…
  while ( m ) {
    // Pick a remaining element…
    i = Math.floor( Math.random() * m-- );

    // And swap it with the current element.
    t = array[ m ];
    array[ m ] = array[ i ];
    array[ i ] = t;
  }

  return array;
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-= BINGO SPACES =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var BingoSpace,
  BingoSpaceView;

BingoSpace = Backbone.Model.extend({
  defaults: function () {
    return {
      checked: false,
      order: card.nextOrder()
    };
  },
  initialize: function() {
    _.bindAll( this, 'toggleChecked' );
  },
  toggleChecked: function() {
    this.save({
      checked: !this.get( 'checked' )
    });
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

    this.listenTo( this.model, 'change', this.render );
    this.listenTo( this.model, 'destroy', this.remove );
  },
  template: _.template( $( '#bingo-space-template' ).html() ),
  render: function() {
    this.$el.html( this.template({
      bingoSpace: this.model,
      config: config
    }) );

    if ( this.model.get( 'checked' ) ) {
      this.$el.addClass( 'bingo-space-checked' );
    } else {
      this.$el.removeClass( 'bingo-space-checked' );
    }

    return this;
  },
  toggleChecked: function() {
    this.model.toggleChecked();
  }
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-= BINGO CARDS -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var BingoCard,
  BingoCardView;

BingoCard = Backbone.Collection.extend({
  model: BingoSpace,
  localStorage: new Backbone.LocalStorage( 'BingoCard' ),
  initialize: function() {
    _.bindAll( this, 'comparator', 'nextOrder' );
  },
  // Sort sequentially instead of by (pseudorandom) GUID in LocalStorage. Good
  // idea and execution by Jerome Gravel-Niquet:
  // https://github.com/jeromegn/Backbone.localStorage/blob/master/examples/todos/todos.js
  nextOrder: function() {
    if ( !this.length ) return 1;
    return this.last().get( 'order' ) + 1;
  },
  comparator: function( bingoSpace ) {
    return bingoSpace.get( 'order' );
  }
});

BingoCardView = Backbone.View.extend({
  tagName: 'ol',
  className: 'bingo-card',
  initialize: function() {
    _.bindAll( this, 'destroyAll', 'render' );

    this.bingoSpaceViews = {};

    this.listenTo( this.collection, 'reset', this.destroyAll );
    this.listenTo( this.collection, 'reset', this.render );
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
  },
  destroyAll: function() {
    _.each( this.bingoSpaceViews, function( bingoSpaceView ) {
      bingoSpaceView.remove();
    }, this );
  }
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-= APPLICATION -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var AppCore;

AppCore = Backbone.View.extend({
  el: $( config.appCoreSelector ).get(),
  initialize: function() {
    _.bindAll( this, 'resetCard' );

    card.fetch();
    if ( !card.length ) {
      this.resetCard();
    }
  },
  resetCard: function() {
    var cardIds,
      cardObjs;

    cardIds = _.clone( config.cardOptions );
    shuffle( cardIds );
    cardObjs = _.map( cardIds.slice( 0, 25 ), function( cardId ) {
      return {
        id: cardId
      }
    });

    card.each(function( bingoSpace ) {
      bingoSpace.destroy();
    });
    card.set( cardObjs );
    card.each(function( bingoSpace ) {
      bingoSpace.save();
    });
  }
});

// -=-=-=-=-=-=-=-=-=-=-= APPLICATION INITIALIZATION =-=-=-=-=-=-=-=-=-=-=-=-=-

var app,
  card,
  cardView;

card = new BingoCard();
app = new AppCore();

cardView = new BingoCardView({
  collection: card
});
cardView.render().$el.appendTo( app.$el );

// -=-=-=-=-=-=-=-=-=-=-=-=-= DEBUGGING VARIABLES -=-=-=-=-=-=-=-=-=-=-=-=-=-=-

window.app = app;
window.AppCore = AppCore;
window.BingoSpace = BingoSpace;
window.BingoSpaceView = BingoSpaceView;
window.BingoCard = BingoCard;
window.BingoCardView = BingoCardView;
window.card = card;
window.cardView = cardView;

}( this ));
