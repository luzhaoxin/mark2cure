//
// Models + Collections
//

TalkComment = Backbone.Model.extend({
  defaults: {
    'user_id': null,
    'user_name': '',
    'comment': '',
    'submit_date': null,
    'pmid': null
  }
});


TalkCommentList = Backbone.Collection.extend({
  model: TalkComment,
  url: '/api/talk/comments/'
});


TalkDocument = Backbone.Model.extend({
  defaults: {
    'id': null,
    'title': '',
    'comments': 0
  }
});


TalkDocumentList = Backbone.Collection.extend({
  model: TalkDocument,
  url: '/api/talk/documents/'
});

//
// Views
//
TalkDocumentItemView = Backbone.Marionette.View.extend({
  template: '#talk-document-item-template',
  className: 'list-group-item flex-column align-items-start',
});

TalkDocumentListView = Backbone.Marionette.CollectionView.extend({
  childView: TalkDocumentItemView
});

TalkDocumentView = Backbone.Marionette.View.extend({
  template: '#talk-list-template',
  templateContext: {
    'list_name': 'Discussed Documents'
  },
  className: 'col',

  regions: {
    'list': '.list-group',
  },

  collectionEvents: {
    'sync': function() { this.render(); }
  },

  initialize: function() {
    this.collection = new TalkDocumentList();
    this.collection.fetch();
  },

  onRender: function() {
    this.showChildView('list', new TalkDocumentListView({'collection': this.collection}));
  }
});

TalkCommentItemView = Backbone.Marionette.View.extend({
  template: '#talk-comment-item-template',
  className: 'list-group-item flex-column align-items-start',
  ui: {
    'time': '.time-ago',
  },
  onRender: function() {
    this.ui.time.html( moment.utc(this.model.get('submit_date')).format('LL') );
  }
});

TalkCommentListView = Backbone.Marionette.CollectionView.extend({
  childView: TalkCommentItemView
});

TalkCommentView = Backbone.Marionette.View.extend({
  template: '#talk-list-template',
  templateContext: {
    'list_name': 'Recent Comments'
  },
  className: 'col',

  regions: {
    'list': '.list-group',
  },



  modelEvents: {
    'sync': function() { this.render(); }
  },

  initialize: function() {
    this.collection = new TalkCommentList();
    this.collection.fetch();
  },

  onRender: function() {
    this.showChildView('list', new TalkCommentListView({'collection': this.collection}));
  }
});


TalkView = Backbone.Marionette.View.extend({
  template: '#talk-template',
  className: 'row justify-content-center mt-3',

  regions: {
    'documents': '#talk-documents',
    'comments': '#talk-comments'
  },

  onRender: function() {
    this.showChildView('documents', new TalkDocumentView());
    this.showChildView('comments', new TalkCommentView());
  }
});

// block post-footer
//   script(type='html/template', id='relation-synopsis-template')
//     p.lead.text-xs-center Click on the circles to see how your answers compared to the community's.
//     ul#relation-synopsis-bar.list-unstyled.list-inline
//     #feedback-next-action-area
//     #chart-context(style='display:none;').row
//       .col-xs-4.col-xs-offset-1.text-right
//         p#concept-a.lead
//       .col-xs-2.text-xs-center
//         | <i class="fa fa-arrows-h fa-2x" aria-hidden="true"></i>
//       .col-xs-4.text-left
//         p#concept-b.lead
//     ul#chart-list.list-unstyled
//
//   script.
//     var relation_task_settings = {
//       'document_pk': "{{ doc.pk }}",
//     };
//   script(src="/static/js/tasks/relation-synopsis.js")
//
//   script.
//     var self_data, passages, regions;
//
//     YPet.addInitializer(function(options) {
//
//       $.getJSON('/task/entity-recognition/{{doc.pk}}/user/{{user.pk}}/results.json', function( data ) {
//         self_data = data;
//         passages = data.collection.document.passage;
//         regions = {};
//
//         _.each(passages, function(passage, passage_idx) {
//           var passage_id = _.find(passage.infon, function(o){return o['@key']=='id';})['#text'];
//           var p_body = '<div id="'+ passage_id +'" class="paragraph-box m-t-1"><p class="paragraph"></p></div></div>';
//           $('.paragraphs').append(p_body);
//           regions[''+passage_idx] = '#'+passage_id;
//         });
//         YPet.addRegions(regions);
//
//         _.each(passages, function(passage, passage_idx) {
//           var p = new Paragraph({'text': passage.text});
//           YPet[''+passage_idx].show( new WordCollectionView({
//             collection: p.get('words'),
//             passage_json: passage,
//             bioc_json: data
//           }) );
//           YPet[''+passage_idx].currentView.drawBioC(passage, false);
//           YPet[''+passage_idx].currentView.drawBioC(null, true);
//         });
//
//       });
//     });
//     YPet.start();
//
//
//     $('ul.pagination li a').on('mouseover', function(evt) {
//       var user_pk = $(this).data('userpk');
//
//       $.getJSON('/task/entity-recognition/{{doc.pk}}/user/'+ user_pk +'/results.json', function( data ) {
//         self_data = data;
//         passages = data.collection.document.passage;
//
//         _.each(passages, function(passage, passage_idx) {
//           var p = new Paragraph({'text': passage.text});
//           YPet[''+passage_idx].show( new WordCollectionView({
//             collection: p.get('words'),
//             passage_json: passage,
//             bioc_json: data
//           }) );
//           YPet[''+passage_idx].currentView.drawBioC(passage, false);
//           YPet[''+passage_idx].currentView.drawBioC(null, true);
//         });
//       });
//
//     });
//
