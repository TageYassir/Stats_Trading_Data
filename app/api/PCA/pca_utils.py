import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.decomposition import PCA


def compute_pca_features(symbols, period="2y", interval="1d"):

    df_list = []

    for sym in symbols:

        ticker = yf.Ticker(sym)
        hist = ticker.history(
            period=period,
            interval=interval
        )

        if not hist.empty:

            series = hist["Close"].rename(sym)

            df_list.append(series)

    if len(df_list) < 2:
        return None

    combined_df = pd.concat(
        df_list,
        axis=1
    ).dropna()

    if combined_df.empty:
        return None

    returns_df = (
        combined_df
        .pct_change()
        .dropna()
    )

    X = returns_df.values

    X_std = (
        X - np.mean(X, axis=0)
    ) / np.std(X, axis=0)

    pca = PCA(n_components=2)

    transformed = pca.fit_transform(X_std)

    pca_df = pd.DataFrame(
        transformed,
        index=returns_df.index,
        columns=["PC1", "PC2"]
    )
    pca_df.index = pd.to_datetime(pca_df.index).tz_localize(None)

    return pca_df