{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE OverloadedStrings #-}

module SocialLab.Types
  ( Preference (..)
  , Person (..)
  , Scenario (..)
  , Assignment
  , AffinityCell (..)
  , CompatibilityCell (..)
  , AssignmentMetrics (..)
  , Deviation (..)
  , AssignmentResult (..)
  , AnalysisResponse (..)
  , ErrorResponse (..)
  ) where

import Data.Aeson
  ( FromJSON (..)
  , Options (fieldLabelModifier)
  , ToJSON (..)
  , defaultOptions
  , genericParseJSON
  , genericToJSON
  , object
  , withObject
  , (.:)
  , (.=)
  )
import Data.Char (toLower)
import Data.List (stripPrefix)
import Data.Map.Strict (Map)
import Data.Text (Text)
import GHC.Generics (Generic)

data Preference = Preference
  { preferenceIdeal :: Double
  , preferenceWeight :: Double
  }
  deriving (Eq, Show, Generic)

instance ToJSON Preference where
  toJSON preference =
    object
      [ "ideal" .= preferenceIdeal preference
      , "weight" .= preferenceWeight preference
      ]

instance FromJSON Preference where
  parseJSON = withObject "Preference" $ \value ->
    Preference
      <$> value .: "ideal"
      <*> value .: "weight"

data Person = Person
  { personId :: Text
  , personName :: Text
  , personTraits :: Map Text Double
  , personPreferences :: Map Text Preference
  , personOutsideOption :: Double
  }
  deriving (Eq, Show, Generic)

instance ToJSON Person where
  toJSON = genericToJSON (prefixedOptions "person")

instance FromJSON Person where
  parseJSON = genericParseJSON (prefixedOptions "person")

data Scenario = Scenario
  { scenarioTitle :: Text
  , scenarioGroupCount :: Int
  , scenarioPeople :: [Person]
  }
  deriving (Eq, Show, Generic)

instance ToJSON Scenario where
  toJSON = genericToJSON (prefixedOptions "scenario")

instance FromJSON Scenario where
  parseJSON = genericParseJSON (prefixedOptions "scenario")

type Assignment = Map Text Int

data AffinityCell = AffinityCell
  { affinityFromId :: Text
  , affinityToId :: Text
  , affinityScore :: Double
  }
  deriving (Eq, Show, Generic)

instance ToJSON AffinityCell where
  toJSON = genericToJSON (prefixedOptions "affinity")

instance FromJSON AffinityCell where
  parseJSON = genericParseJSON (prefixedOptions "affinity")

data CompatibilityCell = CompatibilityCell
  { compatibilityFirstId :: Text
  , compatibilitySecondId :: Text
  , compatibilityScore :: Double
  }
  deriving (Eq, Show, Generic)

instance ToJSON CompatibilityCell where
  toJSON = genericToJSON (prefixedOptions "compatibility")

instance FromJSON CompatibilityCell where
  parseJSON = genericParseJSON (prefixedOptions "compatibility")

data AssignmentMetrics = AssignmentMetrics
  { metricsIndividualUtilities :: Map Text Double
  , metricsCollectiveWelfare :: Double
  , metricsMinimumSatisfaction :: Double
  , metricsMaximumSatisfaction :: Double
  , metricsSatisfactionGap :: Double
  }
  deriving (Eq, Show, Generic)

instance ToJSON AssignmentMetrics where
  toJSON = genericToJSON (prefixedOptions "metrics")

instance FromJSON AssignmentMetrics where
  parseJSON = genericParseJSON (prefixedOptions "metrics")

data Deviation = Deviation
  { deviationPersonId :: Text
  , deviationFromGroup :: Int
  , deviationToGroup :: Int
  , deviationCurrentUtility :: Double
  , deviationAlternativeUtility :: Double
  , deviationGain :: Double
  }
  deriving (Eq, Show, Generic)

instance ToJSON Deviation where
  toJSON = genericToJSON (prefixedOptions "deviation")

instance FromJSON Deviation where
  parseJSON = genericParseJSON (prefixedOptions "deviation")

data AssignmentResult = AssignmentResult
  { resultAssignment :: Assignment
  , resultMetrics :: AssignmentMetrics
  , resultIsNash :: Bool
  , resultDeviations :: [Deviation]
  }
  deriving (Eq, Show, Generic)

instance ToJSON AssignmentResult where
  toJSON = genericToJSON (prefixedOptions "result")

instance FromJSON AssignmentResult where
  parseJSON = genericParseJSON (prefixedOptions "result")

data AnalysisResponse = AnalysisResponse
  { analysisScenario :: Scenario
  , analysisTotalAssignments :: Int
  , analysisAffinities :: [AffinityCell]
  , analysisCompatibilities :: [CompatibilityCell]
  , analysisSocialOptimum :: AssignmentResult
  , analysisFairOptimum :: AssignmentResult
  , analysisNashEquilibria :: [AssignmentResult]
  }
  deriving (Eq, Show, Generic)

instance ToJSON AnalysisResponse where
  toJSON = genericToJSON (prefixedOptions "analysis")

instance FromJSON AnalysisResponse where
  parseJSON = genericParseJSON (prefixedOptions "analysis")

newtype ErrorResponse = ErrorResponse
  { errorMessages :: [Text]
  }
  deriving (Eq, Show, Generic)

instance ToJSON ErrorResponse where
  toJSON = genericToJSON (prefixedOptions "error")

instance FromJSON ErrorResponse where
  parseJSON = genericParseJSON (prefixedOptions "error")

prefixedOptions :: String -> Options
prefixedOptions prefix =
  defaultOptions
    { fieldLabelModifier = dropFieldPrefix prefix
    }

dropFieldPrefix :: String -> String -> String
dropFieldPrefix prefix field =
  case stripPrefix prefix field of
    Just remainder -> lowerFirst remainder
    Nothing -> field

lowerFirst :: String -> String
lowerFirst [] = []
lowerFirst (firstCharacter : rest) = toLower firstCharacter : rest

