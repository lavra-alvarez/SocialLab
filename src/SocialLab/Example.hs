{-# LANGUAGE OverloadedStrings #-}

module SocialLab.Example
  ( exampleScenario
  ) where

import qualified Data.Map.Strict as Map
import Data.Text (Text)
import SocialLab.Types

exampleScenario :: Scenario
exampleScenario =
  Scenario
    { scenarioTitle = "Taller creativo: formación de dos equipos"
    , scenarioGroupCount = 2
    , scenarioPeople =
        [ person "ana" "Ana" [9, 6, 4, 6] [2, 3, 2, 7] [3, 1, 1, 2] 39
        , person "bruno" "Bruno" [1, 9, 7, 2] [5, 2, 8, 5] [3, 3, 3, 1] 36
        , person "carla" "Carla" [1, 4, 8, 9] [8, 6, 8, 4] [4, 3, 4, 3] 34
        , person "diego" "Diego" [3, 9, 9, 9] [7, 2, 3, 3] [3, 2, 4, 2] 30
        , person "elena" "Elena" [2, 5, 1, 4] [7, 4, 3, 2] [2, 4, 2, 3] 41
        , person "fabian" "Fabián" [9, 3, 3, 2] [5, 8, 2, 3] [3, 4, 4, 2] 42
        ]
    }

person :: Text -> Text -> [Double] -> [Double] -> [Double] -> Double -> Person
person identifier name traitValues idealValues weights outsideOption =
  Person
    { personId = identifier
    , personName = name
    , personTraits = Map.fromList (zip criteria traitValues)
    , personPreferences =
        Map.fromList
          [ (criterion, Preference ideal weight)
          | (criterion, ideal, weight) <- zip3 criteria idealValues weights
          ]
    , personOutsideOption = outsideOption
    }

criteria :: [Text]
criteria = ["organizacion", "sociabilidad", "creatividad", "competitividad"]

