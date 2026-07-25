package com.axespeed.mod;

import net.fabricmc.api.ModInitializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AxespeedMod implements ModInitializer {
    public static final String MOD_ID = "axespeed";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

    @Override
    public void onInitialize() {
        LOGGER.info("Hello from Axespeed Mod!");
    }
}