package com.onehits.mod;

import net.fabricmc.api.ModInitializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class OnehitsMod implements ModInitializer {
    public static final String MOD_ID = "onehits";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

    @Override
    public void onInitialize() {
        LOGGER.info("Hello from Onehits Mod!");
    }
}