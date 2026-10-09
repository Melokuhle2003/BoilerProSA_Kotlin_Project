# BoilerPro SA v4 Learner Platform

## Learner workflow

Register → Dashboard → Learn → Practice → Mock Test → Readiness Assessment → Revision.

## Server-side records

The learner application stores:

- lesson progress
- question attempts
- mock-test attempts and scores
- user account information

The learner client does not receive the correct answer index when loading questions. It submits a selected option to the server and receives only the result and explanation.

## Readiness indicator

40% lesson progress + 30% question accuracy + 30% average mock score.

The resulting band is a BoilerPro training indicator and must not be represented as an official trade-test result.
