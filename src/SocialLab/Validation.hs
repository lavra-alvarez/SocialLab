{-# LANGUAGE OverloadedStrings #-}

module SocialLab.Validation
  ( validateScenario
  ) where

import Data.List (group, sort)
import qualified Data.Map.Strict as Map
import qualified Data.Set as Set
import Data.Text (Text)
import qualified Data.Text as Text
import SocialLab.Types

validateScenario :: Scenario -> [Text]
validateScenario scenario =
  groupErrors
    <> peopleCountErrors
    <> duplicateIdErrors
    <> concatMap (validatePerson criteria) people
  where
    people = scenarioPeople scenario
    criteria = maybe Set.empty (Map.keysSet . personTraits) (safeHead people)

    groupErrors =
      ["El MVP requiere exactamente 2 grupos." | scenarioGroupCount scenario /= 2]

    peopleCountErrors =
      ["El escenario debe contener entre 2 y 8 personas." | length people < 2 || length people > 8]

    duplicateIdErrors =
      map ("Identificador duplicado: " <>) (duplicates (map personId people))

validatePerson :: Set.Set Text -> Person -> [Text]
validatePerson expectedCriteria person =
  identityErrors
    <> criteriaErrors
    <> traitErrors
    <> preferenceErrors
    <> weightErrors
    <> outsideOptionErrors
  where
    label = personName person
    traits = personTraits person
    preferences = personPreferences person

    identityErrors =
      ["Hay una persona sin identificador." | Text.null (Text.strip (personId person))]
        <> ["Hay una persona sin nombre." | Text.null (Text.strip label)]

    criteriaErrors =
      ["Los rasgos de " <> label <> " no usan el mismo conjunto de criterios." | Map.keysSet traits /= expectedCriteria]
        <> ["Las preferencias de " <> label <> " no corresponden con sus rasgos." | Map.keysSet preferences /= expectedCriteria]

    traitErrors =
      [ "El rasgo " <> criterion <> " de " <> label <> " debe estar entre 0 y 10."
      | (criterion, value) <- Map.toList traits
      , not (validRange 0 10 value)
      ]

    preferenceErrors =
      [ "El ideal " <> criterion <> " de " <> label <> " debe estar entre 0 y 10."
      | (criterion, preference) <- Map.toList preferences
      , not (validRange 0 10 (preferenceIdeal preference))
      ]

    weightErrors =
      [ "El peso " <> criterion <> " de " <> label <> " no puede ser negativo."
      | (criterion, preference) <- Map.toList preferences
      , not (finite (preferenceWeight preference)) || preferenceWeight preference < 0
      ]
        <> ["La suma de pesos de " <> label <> " debe ser mayor que cero." | totalWeight <= 0]

    totalWeight = sum (map preferenceWeight (Map.elems preferences))

    outsideOptionErrors =
      ["La utilidad de reserva de " <> label <> " debe estar entre 0 y 100." | not (validRange 0 100 (personOutsideOption person))]

validRange :: Double -> Double -> Double -> Bool
validRange minimumValue maximumValue value =
  finite value && value >= minimumValue && value <= maximumValue

finite :: Double -> Bool
finite value = not (isNaN value || isInfinite value)

duplicates :: Ord value => [value] -> [value]
duplicates values =
  [ firstValue
  | groupedValues@(firstValue : _) <- group (sort values)
  , length groupedValues > 1
  ]

safeHead :: [value] -> Maybe value
safeHead [] = Nothing
safeHead (value : _) = Just value

