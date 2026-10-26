{-# LANGUAGE OverloadedStrings #-}

module Main (main) where

import Control.Monad (forM_, unless)
import qualified Data.Map.Strict as Map
import Data.Text (Text)
import SocialLab.Analysis (analyzeScenario, buildAssignmentResult)
import SocialLab.Assignments (allAssignments)
import SocialLab.Compatibility (directedAffinity, mutualCompatibility, similarity)
import SocialLab.Example (exampleScenario)
import SocialLab.Metrics (individualUtility)
import SocialLab.Nash (profitableDeviations)
import SocialLab.Types
import SocialLab.Validation (validateScenario)

main :: IO ()
main = do
  run "el escenario de ejemplo es válido" testValidScenario
  run "la similitud respeta los extremos" testSimilarity
  run "la afinidad dirigida puede ser asimétrica" testDirectedAffinity
  run "la compatibilidad mutua es simétrica" testMutualCompatibility
  run "se generan 2^n asignaciones" testAssignmentCount
  run "una persona sola recibe su utilidad de reserva" testOutsideOption
  run "los equilibrios no tienen desviaciones rentables" testNashResults
  run "el óptimo social domina las demás asignaciones" testSocialOptimum
  run "el ejemplo distingue eficiencia de estabilidad" testDemonstrationContrast
  putStrLn "\nTodas las pruebas de SocialLab pasaron."

run :: String -> IO () -> IO ()
run name test = do
  test
  putStrLn ("✓ " <> name)

testValidScenario :: IO ()
testValidScenario =
  assertEqual [] (validateScenario exampleScenario)

testSimilarity :: IO ()
testSimilarity = do
  assertApprox 1 (similarity 6 6)
  assertApprox 0 (similarity 0 10)
  assertApprox 0.7 (similarity 4 7)

testDirectedAffinity :: IO ()
testDirectedAffinity = do
  let firstPerson =
        Person
          { personId = "first"
          , personName = "Primera"
          , personTraits = Map.singleton "criterio" 10
          , personPreferences = Map.singleton "criterio" (Preference 10 1)
          , personOutsideOption = 0
          }
      secondPerson =
        Person
          { personId = "second"
          , personName = "Segunda"
          , personTraits = Map.singleton "criterio" 0
          , personPreferences = Map.singleton "criterio" (Preference 10 1)
          , personOutsideOption = 0
          }
  assertApprox 0 (directedAffinity firstPerson secondPerson)
  assertApprox 100 (directedAffinity secondPerson firstPerson)

testMutualCompatibility :: IO ()
testMutualCompatibility = do
  let ana = findPerson "ana"
      bruno = findPerson "bruno"
  assertApprox (mutualCompatibility ana bruno) (mutualCompatibility bruno ana)

testAssignmentCount :: IO ()
testAssignmentCount =
  assertEqual 64 (length (allAssignments exampleScenario))

testOutsideOption :: IO ()
testOutsideOption = do
  let ana = findPerson "ana"
      assignment =
        Map.fromList
          [ (personId person, if personId person == "ana" then 0 else 1)
          | person <- scenarioPeople exampleScenario
          ]
  assertApprox (personOutsideOption ana) (individualUtility exampleScenario assignment ana)

testNashResults :: IO ()
testNashResults =
  case analyzeScenario exampleScenario of
    Left errors -> fail (show errors)
    Right analysis -> do
      assertBool (not (null (analysisNashEquilibria analysis)))
      forM_
        (analysisNashEquilibria analysis)
        (\result -> assertEqual [] (profitableDeviations exampleScenario (resultAssignment result)))

testSocialOptimum :: IO ()
testSocialOptimum =
  case analyzeScenario exampleScenario of
    Left errors -> fail (show errors)
    Right analysis -> do
      let bestWelfare = metricsCollectiveWelfare (resultMetrics (analysisSocialOptimum analysis))
          otherWelfares =
            [ metricsCollectiveWelfare (resultMetrics (buildAssignmentResult exampleScenario assignment))
            | assignment <- allAssignments exampleScenario
            ]
      assertBool (all (<= bestWelfare + tolerance) otherWelfares)

testDemonstrationContrast :: IO ()
testDemonstrationContrast =
  case analyzeScenario exampleScenario of
    Left errors -> fail (show errors)
    Right analysis -> do
      assertBool (not (resultIsNash (analysisSocialOptimum analysis)))
      assertBool (resultIsNash (analysisFairOptimum analysis))
      assertBool (resultAssignment (analysisSocialOptimum analysis) /= resultAssignment (analysisFairOptimum analysis))

findPerson :: Text -> Person
findPerson identifier =
  case filter ((== identifier) . personId) (scenarioPeople exampleScenario) of
    person : _ -> person
    [] -> error "Persona de prueba inexistente"

assertBool :: Bool -> IO ()
assertBool condition = unless condition (fail "La condición esperada no se cumplió")

assertEqual :: (Eq value, Show value) => value -> value -> IO ()
assertEqual expected actual =
  unless (expected == actual) (fail ("Esperado: " <> show expected <> ", obtenido: " <> show actual))

assertApprox :: Double -> Double -> IO ()
assertApprox expected actual =
  unless (abs (expected - actual) <= tolerance) (fail ("Esperado: " <> show expected <> ", obtenido: " <> show actual))

tolerance :: Double
tolerance = 1.0e-7

