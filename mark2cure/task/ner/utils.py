from django.contrib.contenttypes.models import ContentType
from django.db import connection

from ...analysis.tasks import generate_reports
from ...analysis.models import Report
from .models import EntityRecognitionAnnotation

from typing import List, Dict
import random


def select_best_opponent(task_pk: int, document_pk: int, player_pk: int) -> int:
    """Try to find an optimal user to pair the player against.
        1) If Golden Master user is available
        2) Random user from best 50% of users with best F Score for this Group
        3) Else return None
    Args:
        task_pk (int): The Task (Quest)
        document_pk (int): The specific Document we're comparing
        player_pk (in): User ID of the person that is being paired

    Returns:
        int: user_pk or None
    """
    cmd_str = ""
    with open('mark2cure/task/ner/commands/get-quest-user-contributions.sql', 'r') as f:
        cmd_str = f.read()
    cmd_str = cmd_str.format(task_id=task_pk, document_id=document_pk)

    c = connection.cursor()
    try:
        c.execute(cmd_str)
        queryset = [dict(zip(['group_pk', 'task_pk', 'user_pk',
                              'quest_completed', 'view_progress', 'total_annotations'], x)) for x in c.fetchall()]
    finally:
        c.close()

    gm_user_pk = 340
    exclude_user_pks = [107, ]

    # Select Golden Master if available
    if len(list(filter(lambda x: x['user_pk'] == gm_user_pk and x['quest_completed'] == 1 and x['user_pk'] not in exclude_user_pks, queryset))) == 1:
        return gm_user_pk

    # Select all other users (not player, gm_user, or excluded_user_pks) that completed the quest
    previous_user_pks = [x['user_pk'] for x in filter(lambda x: x['quest_completed'] == 1 and x['user_pk'] not in [gm_user_pk, player_pk] and x['user_pk'] not in exclude_user_pks, queryset)]

    if len(previous_user_pks) == 0:
        return None

    report = Report.objects.filter(group_id=queryset[0]['group_pk'], report_type=Report.AVERAGE).order_by('-created').first()
    if report:
        df = report.dataframe
        df = df[df['user_id'].isin(previous_user_pks)]
        row_length = df.shape[0]

        if row_length:
            # Top 1/2 of the users (sorted by F)
            df = df.iloc[:int(row_length / 2)]
            # Select 1 at random
            return random.choice(list(df.user_id))
        else:
            return None
    else:
        generate_reports.apply_async(
            args=[queryset[0]['group_pk']],
            queue='mark2cure_tasks')


def determine_f(true_positive, false_positive, false_negative):
    if float(true_positive + false_positive) == 0.0:
        return (0.0, 0.0, 0.0)

    if float(true_positive + false_negative) == 0.0:
        return (0.0, 0.0, 0.0)

    precision = true_positive / float(true_positive + false_positive)
    recall = true_positive / float(true_positive + false_negative)


    if float(precision + recall) > 0.0:
        f = (2 * precision * recall) / (precision + recall)
        return (precision, recall, f)
    else:
        return (0.0, 0.0, 0.0)


NER_ANN_MATCHING_KEYS = ['start', 'text', 'type_idx']


def match_exact(gm_ann: Dict, user_anns: List[Dict]) -> bool:
    for user_ann in user_anns:
        if all([True if user_ann[k] == gm_ann[k] else False for k in NER_ANN_MATCHING_KEYS]):
            return True
    return False


def generate_results(user_view_pks: List[int], gm_view_pks: List[int]):
    """
      This calculates the comparsion overlap between two arrays of dictionary terms

      It considers both the precision p and the recall r of the test to compute the score:
      p is the number of correct results divided by the number of all returned results
      r is the number of correct results divided by the number of results that should have been returned.
      The F1 score can be interpreted as a weighted average of the precision and recall, where an F1 score reaches its best value at 1 and worst score at 0.

     tp  fp
     fn  *tn
    """
    cmd_str = ""
    with open('mark2cure/task/ner/commands/get-ner-annotations-for-scoring-compare.sql', 'r') as f:
        cmd_str = f.read()
    cmd_str = cmd_str.format(ct_id=ContentType.objects.get_for_model(EntityRecognitionAnnotation).id,
                             user_view_ids=','.join([str(x) for x in user_view_pks]),
                             gm_view_ids=','.join([str(x) for x in gm_view_pks]))

    c = connection.cursor()
    try:
        c.execute(cmd_str)
        queryset = [dict(zip(['user', 'view_id', 'section_id',
                              'completed', 'start', 'type_idx',
                              'text'], x)) for x in c.fetchall()]
    finally:
        c.close()

    user_annotations = list(filter(lambda x: x['user'] == 0, queryset))
    gm_annotations = list(filter(lambda x: x['user'] == 1, queryset))

    # 1)
    true_positives = [gm_ann for gm_ann in gm_annotations if match_exact(gm_ann, user_annotations)]

    # 2)
    false_positives = user_annotations
    for tp in true_positives:
        false_positives = list(filter(lambda ner_ann: ner_ann['start'] != tp['start'] and ner_ann['text'] != tp['text'], false_positives))

    # 3)
    false_negatives = gm_annotations
    for tp in true_positives:
        false_negatives = list(filter(lambda ner_ann: ner_ann['start'] != tp['start'] and ner_ann['text'] != tp['text'], false_negatives))

    # print('-'*6)
    # print(len(true_positives), len(false_positives))
    # print(len(false_negatives), '*')
    # print('-'*6)

    score = determine_f(len(true_positives), len(false_positives), len(false_negatives))
    return (score, true_positives, false_positives, false_negatives)
