# Population

The population is a set of **cohorts** rather than individuals. Cohorts
are intersectional slices (region, class, age, education, ideology).

## Each cohort tracks

- Size
- Mood (approval by topic)
- Radicalism (propensity to leave normal politics)
- Turnout model inputs

## Drift

- Weekly tick: ambient drift based on [[Economy]] signals and recent
  [[Events]].
- Legislative effects: new laws apply modifiers to relevant cohorts.
- Radicalism decays toward a baseline when shocks are absent.

## TODO

- Document the intersectional bucketing algorithm.
- Publish cohort schema.

See also [[Economy]], [[Events]].
