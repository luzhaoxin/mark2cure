from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
# from django.db.models import Count

from mark2cure.document.models import Document, Section, View, Annotation
from mark2cure.account.models import Ncbo
from django.contrib.auth.models import User

import os, os.path, csv


class Command(BaseCommand):
    args = '<experiment_run_id>'
    help = 'Run and calculate metrics for the experiment'

    def handle(self, *args, **options):
        for experiment in args:
            self.stdout.write('-- Running analytics on Experiment Run %s --' % experiment)

            base_path = os.path.join(settings.PROJECT_PATH, 'results')
            os.chdir(base_path)

            # views, hits = self.get_experiment_data(experiment)
            # gm_views = self.get_user_data('goldenmaster', 'NCBI_corpus_development')
            # gm_anns = Annotation.objects.filter(user_agent = 'goldenmaster').all()
            # gm_user = User.objects.get(username__exact = 'goldenmaster')
            # ncbo_user = User.objects.get(username__exact = 'ncbo_5_5')

            documents = Document.objects.filter(source = 'NCBI_corpus_development').all()

            # self.util_ncbo_specturm(documents)
            self.util_worker_specturm(documents)


    def util_worker_specturm(self, documents):
        '''
          Generates a table of NCBO vs K1-5 users annotations for the list of input Documents
        '''
        gm_user = User.objects.get(username__exact = 'goldenmaster')
        types = ["*", "disease:modifier", "disease:class", "disease:specific", "disease:composite"]

        for disease_type in types:
          for document in documents:
            results = {}
            true_positives = []
            false_positives = []
            false_negatives = []

            for section in document.section_set.all():

              # Get the annotation for this grouping
              if disease_type is "*":
                gold_query = Annotation.objects.filter(view__section = section, view__user = gm_user)
                work_query = Annotation.objects.filter(view__section = section, experiment = 3, view__user__userprofile__mturk = True)
              else:
                gold_query = Annotation.objects.filter(type = disease_type, view__section__document = document, view__user = gm_user)
                work_query = Annotation.objects.filter(type = disease_type, view__section = section, experiment = 3, view__user__userprofile__mturk = True)

              gm_anns = gold_query.all()
              worker_anns = work_query.all()
              # When gold_k is 0, that section (likely a title) has no disease terms in it
              gold_k = len(gold_query.values('view__user').distinct())
              worker_k = len(work_query.values('view__user').distinct())

              #
              # LOGGING
              #
              # print "\nGM Anns: "
              # for gm_ann in gm_anns:
              #   print gm_ann.text + " :: " + str(gm_ann.start)

              # print "\nWorker Anns: "
              # for worker_ann in worker_anns:
              #   print worker_ann.text + " :: " + str(worker_ann.start)

              # worker_score = self.calc_score(worker_anns, gm_anns)
              # print worker_score
              # print "\n - - - - - - \n"

              k = {}
              for i in range(1, worker_k + 1): k[i] = []

              # Looping through all the unique annotations to get their counts to actual
              # submitted annotations for the workers results
              worker_dict_anns = list( work_query.values('text', 'start') )
              gm_dict_anns = list( gold_query.values('text', 'start') )
              worker_uniq_anns = worker_anns.values('text', 'start').distinct()

              for ann in worker_uniq_anns:
                # Put that annotation into the k for the # that it matches (how many times did workers agree on that
                # particular annotation) and everything below it
                # Ex: If an annotation matches 3 times, it also matches 2 times

                for i in range(1, worker_dict_anns.count(ann) + 1 ):
                  k[i].append( ann )

                  # Put the document K score annotations and append their TP/FP/FN counts to the K results
                  score = self.calc_score(k[i], gm_dict_anns)
                  true_positives = score[0]
                  false_positives = score[1]
                  false_negatives = score[2]
                  score = ( len(score[0]), len(score[1]), len(score[2]) )

                for i in range(1, worker_k + 1): results[i].append( score )

            print results
            # We've now built up the results dictionary for our K scores and NCBO annotator for all the documents.
            # Sum all the scores up, calculate their P/R/F and print it out
            # for i in range(1, worker_k + 1):
            #   results[group] = map(sum,zip(*results[group]))
            #   results[group] = self.determine_f( results[group][0], results[group][1], results[group][2] )
            #   print "\t".join(["{} ".format(group), "%.2f"%results[group][0], "%.2f"%results[group][1], "%.2f"%results[group][2]])


        # results.append( ncbo_score )
        # report = compareAnnosCorpusLevel(gold_annos, test_annos);
        #     with open('.csv', 'wb') as csvfile:
        #       writer = csv.writer(csvfile, delimiter=',')
        #       writer.writerow(['foo', 'bar', 'tall'])
        #     # print len(views)
        #     # print len(gm_views)


    def util_ncbo_specturm(self, documents):
        # ncbos = User.objects.filter(userprofile__ncbo = True).all()
        ncbos = Ncbo.objects.filter(score__lt = 15).all()
        gm_user = User.objects.get(username__exact = 'goldenmaster')

        with open('ncbo_spectrum.csv', 'wb') as csvfile:
          writer = csv.writer(csvfile, delimiter=',')
          writer.writerow(["Score", "Min Term Size", "TP", "FP", "FN", "P", "R", "F"])

          for ncbo in ncbos:
            results = []
            for document in documents:
              for section in document.section_set.all():
                # Collect the list of Annotations models for the Golden Master and NCBO Annotator to use throughout
                gm_annotations = list( Annotation.objects.filter(view__section = section, view__user = gm_user).values('text', 'start') )
                ncbo_annotations = list( Annotation.objects.filter(view__section = section, view__user = ncbo.user).values('text', 'start') )

                #
                # LOGGING
                #
                # print "\nGM Anns: "
                # for gm_ann in gm_annotations:
                #   print gm_ann.text + " :: " + str(gm_ann.start)

                # print "\nNCBO Anns: "
                # for ncbo_ann in ncbo_annotations:
                #   print ncbo_ann.text + " :: " + str(ncbo_ann.start)

                # print "\n - - - - - - \n"

                ncbo_score = self.calc_score(ncbo_annotations, gm_annotations)
                ncbo_score = ( len(ncbo_score[0]), len(ncbo_score[1]), len(ncbo_score[2]) )
                results.append( ncbo_score )


            results = map(sum,zip(*results))
            score = self.determine_f( results[0], results[1], results[2] )
            arr = [ncbo.score, ncbo.min_term_size, results[0], results[1], results[2], score[0], score[1], score[2]]
            writer.writerow(arr)
            print arr


    def match_exact(self, gm_ann, user_anns):
        '''
          Exact or Coextensive match finding for annotations. Works off start of annotation and cleaned length both being equal

          Returns True is any of the user annotations are equal to this GM Annotation

        '''
        gm_len = len(gm_ann['text'])
        for user_ann in user_anns:
          if gm_ann['start'] == user_ann['start'] and gm_len == len(user_ann['text']): return True
        return False


    def dict_to_tuple(self, dic):
        return (dic['text'], int(dic['start']))


    def calc_score(self, annotations_a, annotations_b):
      '''
        This calculates the comparsion overlap between two arrays of dictionary terms

        It considers both the precision p and the recall r of the test to compute the score:
        p is the number of correct results divided by the number of all returned results
        r is the number of correct results divided by the number of results that should have been returned.
        The F1 score can be interpreted as a weighted average of the precision and recall, where an F1 score reaches its best value at 1 and worst score at 0.

       tp  fp
       fn  *tn

      '''
      true_positives = [gm_ann for gm_ann in annotations_b if self.match_exact(gm_ann, annotations_a)]

      # In order to make our comparisons we need to do the conversion to a list of tuples
      true_positives = [self.dict_to_tuple(item) for item in true_positives]
      annotations_a  = [self.dict_to_tuple(item) for item in annotations_a]
      annotations_b  = [self.dict_to_tuple(item) for item in annotations_b]

      # Annotations the user submitted that were wrong (the User set without their True Positives)
      false_positives = set(annotations_a) - set(true_positives)

      # Annotations the user missed (the GM set without their True Positives)
      false_negatives = set(annotations_b) - set(true_positives)

      # Add the False Positives and False Negatives to a global array to keep track which
      # annotations are commonly incorrect
      # for tp in true_positives:  self.error_aggreements['true_positives' ].append( tp[1][1] )
      # for fp in false_positives: self.error_aggreements['false_positives'].append( fp[1][1] )
      # for fn in false_negatives: self.error_aggreements['false_negatives'].append( fn[1][1] )

      return ( true_positives, false_positives, false_negatives )


    def determine_f(self, true_positive, false_positive, false_negative):
        if true_positive + false_positive is 0:
          return (0,0,0)

        precision = true_positive / float(true_positive + false_positive)
        recall = true_positive / float(true_positive + false_negative)

        if precision + recall > 0.0:
          f = ( 2 * precision * recall ) / ( precision + recall )
          return (precision, recall, f)
        else:
          return (0,0,0)


    def compare_turk_to_gold():
      pass


    def get_user_data(self, username, source):
      views = View.objects.filter(user__username = username, section__document__source = source).all()
      return views


    def get_experiment_data(self, experiment):
      '''
        Returns all the Annotations for an experiment
        (TODO) Confirm they source documents for the correct experiment GM set
      '''
      if experiment is 1:
          # filter( Annotation.user.has(mturk=1) ).\
          # filter( Annotation.created < '2013-11-6' ).\
          annotations = Annotation.objects.filter(experiment = experiment).all()
      elif experiment is 2:
            # filter( Annotation.user.has(mturk=1) ).\
            # filter_by( experiment = experiment ).\
          annotations = Annotation.objects.filter(experiment = experiment).all()
      else:
          # annotations = Annotation.objects.filter(view__user__userprofile__mturk = True).all()
          annotations = Annotation.objects.filter(experiment = 3).all()
          views = View.objects.filter(user__userprofile__mturk = True).all()

      return views, annotations


