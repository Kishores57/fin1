export class CalculatorService {
  /**
   * Converts Girth at Breast Height (GBH in cm) to Diameter at Breast Height (DBH in cm).
   * DBH = GBH / pi
   */
  static calculateDbh(gbh) {
    if (gbh <= 0) {
      throw new Error('Girth (GBH) must be greater than zero.');
    }
    return gbh / Math.PI;
  }

  /**
   * Estimates the age of a tree in years.
   * Age = DBH / MAI
   */
  static estimateAge(dbh, mai) {
    if (dbh <= 0) {
      throw new Error('Diameter (DBH) must be greater than zero.');
    }
    if (mai <= 0) {
      throw new Error('Mean Annual Increment (MAI) must be greater than zero.');
    }
    return dbh / mai;
  }

  /**
   * Calculates aboveground dry biomass (AGB in kg) using the Chave Allometric Equation.
   * AGB = 0.0673 * (wood_density * dbh^2 * height)^0.976
   */
  static calculateBiomass(dbh, woodDensity, height) {
    if (dbh <= 0 || woodDensity <= 0 || height <= 0) {
      throw new Error('All parameters (DBH, wood density, height) must be greater than zero.');
    }
    const val = woodDensity * Math.pow(dbh, 2) * height;
    return 0.0673 * Math.pow(val, 0.976);
  }

  /**
   * Calculates stored carbon (in kg) from Aboveground Biomass (AGB).
   * Carbon = Biomass * 0.47
   */
  static calculateCarbon(biomass) {
    if (biomass <= 0) {
      throw new Error('Biomass must be greater than zero.');
    }
    return biomass * 0.47;
  }

  /**
   * Calculates CO2 equivalent sequestered (in kg) from stored carbon.
   * CO2 = Carbon * 3.67
   */
  static calculateCo2(carbon) {
    if (carbon <= 0) {
      throw new Error('Carbon must be greater than zero.');
    }
    return carbon * 3.67;
  }

  /**
   * Calculates oxygen released (in kg) from carbon storage.
   * Oxygen = Carbon * 2.67
   */
  static calculateOxygen(carbon) {
    if (carbon <= 0) {
      throw new Error('Carbon must be greater than zero.');
    }
    return carbon * 2.67;
  }

  /**
   * Runs the full chain of tree allometric and ecological calculations.
   */
  static processTreeCalculations(species, gbh, height) {
    if (!species) {
      throw new Error('Species details are required for calculation.');
    }
    if (height <= 0) {
      throw new Error('Height must be greater than zero.');
    }

    const dbh = this.calculateDbh(gbh);
    const age = this.estimateAge(dbh, species.mai);
    const biomass = this.calculateBiomass(dbh, species.wood_density, height);
    const carbon = this.calculateCarbon(biomass);
    const co2 = this.calculateCo2(carbon);
    const oxygen = this.calculateOxygen(carbon);

    return {
      species_id: species.id,
      species_name: species.name,
      wood_density: species.wood_density,
      dbh,
      age,
      biomass,
      carbon,
      co2,
      oxygen,
    };
  }
}

export default CalculatorService;
