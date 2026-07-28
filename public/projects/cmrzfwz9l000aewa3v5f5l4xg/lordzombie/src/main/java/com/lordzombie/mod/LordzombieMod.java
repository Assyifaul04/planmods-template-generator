package com.lordzombie.mod;

import net.fabricmc.api.ModInitializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class LordzombieMod implements ModInitializer {
    public static final String MOD_ID = "lordzombie";
    public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);

    @Override
    public void onInitialize() {
        LOGGER.info("Hello from Lordzombie Mod!");
    }
}