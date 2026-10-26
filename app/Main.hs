{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE ScopedTypeVariables #-}

module Main (main) where

import Data.Aeson (encode, object, (.=))
import qualified Data.ByteString.Lazy.Char8 as LazyByteString
import Control.Exception (SomeException)
import Network.HTTP.Types.Status (badRequest400)
import SocialLab.Analysis (analyzeScenario)
import SocialLab.Example (exampleScenario)
import SocialLab.Types (ErrorResponse (..), Scenario)
import System.Environment (getArgs, lookupEnv)
import System.Exit (exitFailure)
import Text.Read (readMaybe)
import Web.Scotty

main :: IO ()
main = do
  arguments <- getArgs
  case arguments of
    ["--demo"] -> printDemo
    _ -> runServer

printDemo :: IO ()
printDemo =
  case analyzeScenario exampleScenario of
    Left errors -> do
      LazyByteString.putStrLn (encode (ErrorResponse errors))
      exitFailure
    Right analysis -> LazyByteString.putStrLn (encode analysis)

runServer :: IO ()
runServer = do
  port <- resolvePort
  putStrLn ("SocialLab disponible en http://localhost:" <> show port)
  scotty port routes

routes :: ScottyM ()
routes = do
  get "/" $ do
    setHeader "Content-Type" "text/html; charset=utf-8"
    setHeader "Cache-Control" "no-store"
    file "static/index.html"
  get "/styles.css" $ do
    setHeader "Content-Type" "text/css; charset=utf-8"
    setHeader "Cache-Control" "no-store"
    file "static/styles.css"
  get "/app.js" $ do
    setHeader "Content-Type" "text/javascript; charset=utf-8"
    setHeader "Cache-Control" "no-store"
    file "static/app.js"

  get "/api/health" $
    json (object ["status" .= ("ok" :: String)])

  get "/api/scenario" $ json exampleScenario

  post "/api/analyze" $ do
    scenario <-
      (jsonData :: ActionM Scenario)
        `catch` \(_ :: SomeException) -> do
          status badRequest400
          json (ErrorResponse ["El cuerpo JSON no es válido."])
          finish
    case analyzeScenario scenario of
      Left errors -> do
        status badRequest400
        json (ErrorResponse errors)
      Right analysis -> json analysis

resolvePort :: IO Int
resolvePort = do
  configuredPort <- lookupEnv "PORT"
  pure (maybe 3000 id (configuredPort >>= readMaybe))

