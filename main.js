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

// ES5 shims
if ( !String.prototype.trim ) {
  String.prototype.trim = function () {
    return this.replace( /^\s+|\s+$/g, '' );
  };
}

// Library variables
var $ = window.jQuery,
  _ = window._,
  Backbone = window.Backbone,
  ga = window.ga;

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=- CONFIGURATION =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

_.templateSettings.variable = 'context';

var config = {
  appCoreSelector: '#bingo-app',
  cardOptions: [
    'Viral',
    'Crowd\u00adsource',
    'Buzz\u00adword',
    'Engage\u00adment',
    'Analytics',
    'Fusion Tables',
    'CMS',
    'Veri\u00adfi\u00adcation',
    'Respon\u00adsive design',
    'Comments',
    'Aggreg\u00adation',
    'Mobile-first',
    'Social',
    'Knight Foun\u00adda\u00adtion',
    'iPhone 6',
    'Pivot',
    'User stories',
    'Audience',
    'Story\u00adtelling',
    'Show your work',
    'Storify',
    'FOIA',
    'User-gener\u00adated content',
    'Twitter verified',
    'Moder\u00adation',
    'Karaoke',
    'Someone defending Google+',
    'Google Glass',
    'iOS 7',
    'Info\u00adgraphics',
    'Network',
    'Big Data',
    'New revenue streams',
    'Public interest',
    'Google Hangout',
    'Snow Fall'
  ],
  cardsTall: 5,
  cardsWide: 5,
  winningCombos: [
    // Rows
    [ 0, 1, 2, 3, 4 ],
    [ 5, 6, 7, 8, 9 ],
    [ 10, 11, 12, 13, 14 ],
    [ 15, 16, 17, 18, 19 ],
    [ 20, 21, 22, 23, 24 ],
    // Columns
    [ 0, 5, 10, 15, 20 ],
    [ 1, 6, 11, 16, 21 ],
    [ 2, 7, 12, 17, 22 ],
    [ 3, 8, 13, 18, 23 ],
    [ 4, 9, 14, 19, 24 ],
    // Diagonals
    [ 0, 6, 12, 18, 24 ],
    [ 4, 8, 12, 16, 20 ]
  ]
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
    // Don't let the user uncheck the free space.
    if ( this.get( 'name' ) === 'free space' ) {
      this.set({
        checked: true
      });
      return;
    }

    // For non-free spaces, toggle the space's checked state.
    this.set({
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

    // Send an analytics event.
    if ( this.model.get( 'checked' ) ) {
      ga && ga('send', {
        'hitType': 'event',
        'eventCategory': 'spaceChange',
        'eventAction': 'check',
        'eventLabel': this.model.get( 'name' )
      });
    } else {
      ga && ga('send', {
        'hitType': 'event',
        'eventCategory': 'spaceChange',
        'eventAction': 'uncheck',
        'eventLabel': this.model.get( 'name' )
      });
    }
  }
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-= BINGO CARDS -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var BingoCard,
  BingoCardView;

BingoCard = Backbone.Collection.extend({
  model: BingoSpace,
  initialize: function() {
    _.bindAll( this, 'comparator', 'nextOrder', 'validate' );
  },
  validate: function() {
    // For each combo option listed in config.winningCombos:
    //   * Go through each index listed, and determine whether the bingo space
    //     at that index is checked.
    //   * Return whether _all_ of the spaces were checked.
    // If any of those combo options end up true (i.e., all of the spaces it
    // identifies were checked), return true.
    return typeof _.find( config.winningCombos, function( combo ) {
      var comboChecks = _.map( combo, function( spaceIndex ) {
        return this.at( spaceIndex ).get( 'checked' );
      }, this );

      return typeof _.find( comboChecks, function( check ) {
        return !check;
      }, this ) === 'undefined';
    }, this ) !== 'undefined';
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
    _.bindAll( this, 'destroyAll', 'markWin', 'render' );

    this.bingoSpaceViews = {};

    this.listenTo( this.collection, 'reset', this.render );
    this.listenTo( this.collection, 'change', this.markWin );
  },
  render: function() {
    this.destroyAll();

    this.collection.each(function( bingoSpace ) {
      var bingoSpaceView,
        bingoSpaceId;

      bingoSpaceId = bingoSpace.get( 'id' );

      bingoSpaceView = new BingoSpaceView({
        model: bingoSpace
      });
      this.$el.append( bingoSpaceView.render().$el );

      this.bingoSpaceViews[ bingoSpaceId ] = bingoSpaceView;
    }, this );

    this.$win = $( '#bingo-win' ).removeClass( 'bingo-win-won' );

    return this;
  },
  destroyAll: function() {
    _.each( this.bingoSpaceViews, function( bingoSpaceView ) {
      bingoSpaceView.remove();
    }, this );
  },
  markWin: function() {
    if ( this.collection.validate() ) {
      this.$win.addClass( 'bingo-win-won' );

      ga && ga('send', {
        'hitType': 'event',
        'eventCategory': 'gameEnd',
        'eventAction': 'win'
      });
    } else {
      this.$win.removeClass( 'bingo-win-won' );
    }
  }
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-= APPLICATION -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var AppCore;

AppCore = Backbone.View.extend({
  el: $( config.appCoreSelector ).get(),
  events: {
    'click #bingo-reset': 'resetCard'
  },
  initialize: function() {
    _.bindAll( this, 'initCard', 'resetCard' );

    this.initCard();
  },
  initCard: function() {
    var cardIds,
      cardObjs;

    cardIds = _.clone( config.cardOptions );
    shuffle( cardIds );
    cardObjs = _.map( cardIds.slice( 0, 12 ), function( cardId ) {
      return {
        id: cardId.replace( '\u00ad', '' ),
        name: cardId
      };
    });
    cardObjs.push({
      id: 'free space',
      name: 'free space',
      checked: true
    });
    cardObjs.push.apply(
      cardObjs,
      _.map( cardIds.slice( 12, 24 ), function( cardId ) {
        return {
          id: cardId.replace( '\u00ad', '' ),
          name: cardId
        };
      }) );

    card.reset([]);
    card.set( cardObjs );
  },
  resetCard: function() {
    this.initCard();
    cardView.render();
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
cardView.render().$el.prependTo( app.$el );

// -=-=-=-=-=-=-=-=-=-=-=-=- HOMEMADE TWEET BUTTON =-=-=-=-=-=-=-=-=-=-=-=-=-=-

$( '.bingo-win-tweet' ).on( 'click', function( event ) {
  event.preventDefault();

  var session = $( '.bingo-win-session' ).val().trim();

  if ( session.length ) {
    session += ' ';
  }

  window.open(
    ('http://twitter.com/share?text=' +
      encodeURIComponent( 'Bingo! ' + session + '#ONA13 #ONAbingo' ) +
      '&url=' + encodeURIComponent( window.location.href )),
    'sharer', 'toolbar=0,status=0,width=626,height=436'
  );
});

}( this ));
